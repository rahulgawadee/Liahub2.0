const mongoose = require("mongoose");
const JobPosting = require("../models/JobPosting");
const JobApplication = require("../models/JobApplication");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

// Helper function to automatically close jobs past deadline
const checkAndUpdateExpiredJobs = async () => {
  const now = new Date();
  const expiredJobs = await JobPosting.find({
    status: "open",
    deadline: { $lt: now }
  });

  if (expiredJobs.length > 0) {
    const expiredJobIds = expiredJobs.map(j => j._id);
    
    // Update all expired jobs to hiring_stopped
    await JobPosting.updateMany(
      { _id: { $in: expiredJobIds } },
      { status: "hiring_stopped" }
    );

    // Notify applicants for each expired job
    for (const job of expiredJobs) {
      const applications = await JobApplication.find({ 
        job: job._id,
        status: { $in: ['applied', 'under_review', 'interview'] }
      });

      if (applications.length > 0) {
        const notifications = applications.map(app => ({
          recipient: app.applicant,
          type: "job_hiring_stopped",
          message: `The application deadline for "${job.title}" has passed. Hiring has been stopped.`,
          metadata: { jobId: job._id, jobTitle: job.title },
        }));

        await Notification.insertMany(notifications);
      }
    }
  }
};

const listJobs = async ({ filters = {}, page = 1, limit = 20, currentUserId }) => {
  // Auto-check and update expired jobs
  await checkAndUpdateExpiredJobs();

  const query = {};
  if (filters.organization) query.organization = filters.organization;
  if (filters.type) query.type = filters.type;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const [items, total] = await Promise.all([
    JobPosting.find(query)
      .populate("organization", "name type")
      .populate("createdBy", "username name media")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    JobPosting.countDocuments(query),
  ]);

  if (items.length === 0) {
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  const jobIds = items.map((job) => job.id || job._id);

  const [counts, userApplications] = await Promise.all([
    JobApplication.aggregate([
      { $match: { job: { $in: jobIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$job", total: { $sum: 1 } } },
    ]),
    currentUserId
      ? JobApplication.find({ job: { $in: jobIds }, applicant: currentUserId })
          .select("job status createdAt updatedAt")
      : [],
  ]);

  const countMap = counts.reduce((acc, entry) => {
    acc[entry._id.toString()] = entry.total;
    return acc;
  }, {});

  const appliedMap = new Map();
  userApplications.forEach((application) => {
    appliedMap.set(application.job.toString(), application);
  });

  const serialized = items.map((jobDoc) => {
    const job = jobDoc.toJSON();
    const jobId = job.id.toString();
    const application = appliedMap.get(jobId);

    return {
      ...job,
      applicantsCount: countMap[jobId] || 0,
      applicants: countMap[jobId] || 0,
      applied: Boolean(application),
      applicationStatus: application?.status,
      appliedAt: application?.createdAt,
      isDeadlinePassed: job.deadline && new Date(job.deadline) < new Date(),
    };
  });

  return { items: serialized, total, page, pages: Math.ceil(total / limit) };
};

const createJob = async ({ payload, actorId }) => {
  const job = await JobPosting.create({ ...payload, createdBy: actorId });
  return job;
};

const updateJob = async ({ jobId, payload }) => {
  const job = await JobPosting.findByIdAndUpdate(jobId, payload, { new: true });
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }
  return job;
};

const applyForJob = async ({ jobId, applicantId, organizationId, payload }) => {
  try {
    // Find the job first
    const job = await JobPosting.findById(jobId);
    if (!job) {
      throw Object.assign(new Error("Job not found"), { status: 404 });
    }
    if (job.status !== "open") {
      throw Object.assign(new Error("Applications closed"), { status: 400 });
    }
    if (job.deadline && job.deadline < new Date()) {
      throw Object.assign(new Error("Deadline passed"), { status: 400 });
    }

    // Use job's organization if applicant doesn't have one (e.g., students)
    const applicationOrganization = organizationId || job.organization;

    // Create the application
    const application = await JobApplication.create({
      job: job.id,
      applicant: applicantId,
      organization: applicationOrganization,
      resumeUrl: payload.resumeUrl,
      coverLetter: payload.coverLetter,
      metadata: payload.metadata,
      timeline: [
        {
          status: "applied",
          comment: "Application submitted",
          createdBy: applicantId,
        },
      ],
    });

    // Create notification for job creator
    await Notification.create({
      recipient: job.createdBy,
      actor: applicantId,
      type: "job_application",
      entity: { kind: "JobApplication", id: application.id },
      payload: { jobId: job.id },
    });

    return application;
  } catch (error) {
    if (error.code === 11000) {
      throw Object.assign(new Error("Already applied"), { status: 409 });
    }
    throw error;
  }
};

const updateApplicationStatus = async ({ applicationId, status, actorId, comment, stage, notes, offerLetter }) => {
  const application = await JobApplication.findById(applicationId)
    .populate('applicant', 'username name contact email')
    .populate({
      path: 'job',
      select: 'title organization location',
      populate: { path: 'organization', select: 'name' }
    });
    
  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  application.status = status;
  if (stage) application.stage = stage;
  if (notes) application.notes = notes;
  if (offerLetter) {
    application.offerLetter = {
      ...application.offerLetter,
      ...offerLetter,
    };
  }
  application.timeline.push({ status, comment, createdBy: actorId });
  await application.save();

  // Create notification for applicant
  await Notification.create({
    recipient: application.applicant._id,
    actor: actorId,
    type: "job_status_update",
    entity: { kind: "JobApplication", id: application.id },
    payload: { 
      status,
      stage: stage || application.stage,
      jobTitle: application.job.title
    },
  });

  // Send email for important status updates
  const email = application.applicant.contact?.email || application.applicant.email;
  const studentName = application.applicant.name?.first || application.applicant.username;
  const companyName = application.job.organization?.name || 'the company';
  const jobTitle = application.job.title;

  if (email && ['selected', 'interview', 'rejected', 'hired'].includes(status)) {
    let subject, message, color;
    
    if (status === 'selected') {
      subject = `Great News! Application Selected - ${jobTitle}`;
      message = `Congratulations! Your application for the position of "${jobTitle}" at ${companyName} has been selected for the next stage.`;
      color = '#28a745';
    } else if (status === 'interview') {
      subject = `Interview Invitation - ${jobTitle}`;
      message = `Good news! You've been invited for an interview for the position of "${jobTitle}" at ${companyName}.`;
      color = '#17a2b8';
    } else if (status === 'rejected') {
      subject = `Application Update - ${jobTitle}`;
      message = `Thank you for your interest in the position of "${jobTitle}" at ${companyName}. After careful consideration, we have decided to move forward with other candidates.`;
      color = '#dc3545';
    } else if (status === 'hired') {
      subject = `Congratulations! You're Hired - ${jobTitle}`;
      message = `We are delighted to inform you that you have been hired for the position of "${jobTitle}" at ${companyName}!`;
      color = '#28a745';
    }

    try {
      await sendEmail({
        to: email,
        subject,
        text: `Dear ${studentName},\n\n${message}\n\n${notes ? `Note: ${notes}\n\n` : ''}Please log in to your LiaHub account for more details.\n\nBest regards,\n${companyName}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
      <p>${status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
    </div>
    <div class="content">
      <p>Dear ${studentName},</p>
      <p>${message}</p>
      ${notes ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;"><strong>Note from employer:</strong><p>${notes}</p></div>` : ''}
      <p>Please log in to your LiaHub account for more details.</p>
      <p style="margin-top: 30px;">Best regards,<br/><strong>${companyName}</strong></p>
    </div>
  </div>
</body>
</html>`
      });
    } catch (emailError) {
      console.error(`Failed to send status update email to ${email}:`, emailError);
    }
  }

  return application;
};

const listApplications = async ({ jobId, status, page = 1, limit = 50 }) => {
  const query = { job: jobId };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    JobApplication.find(query)
      .populate("applicant", "username name media contact social studentProfile staffProfile companyProfile roles followerCount followingCount")
      .populate({
        path: "job",
        select: "title type organization location",
        populate: { path: "organization", select: "name type" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    JobApplication.countDocuments(query),
  ]);

  const summary = items.reduce(
    (acc, application) => {
      acc.total += 1;
      const currentStatus = application.status;
      if (["offer"].includes(currentStatus)) acc.offers += 1;
      if (["hired"].includes(currentStatus)) acc.hired += 1;
      if (["rejected", "withdrawn"].includes(currentStatus)) acc.closed += 1;
      if (["under_review", "interview"].includes(currentStatus)) acc.inProcess += 1;
      return acc;
    },
    { total: 0, offers: 0, hired: 0, closed: 0, inProcess: 0 }
  );

  return {
    items: items.map((application) => application.toJSON()),
    total,
    page,
    pages: Math.ceil(total / limit),
    summary,
  };
};

const deleteJob = async ({ jobId, actorId }) => {
  const job = await JobPosting.findById(jobId);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  // Check if there are any applications
  const applicationCount = await JobApplication.countDocuments({ job: jobId });
  if (applicationCount > 0) {
    throw Object.assign(new Error("Cannot delete job with existing applications"), { status: 400 });
  }

  await JobPosting.findByIdAndDelete(jobId);
  return { success: true, message: "Job deleted successfully" };
};

const stopHiring = async ({ jobId, actorId }) => {
  const job = await JobPosting.findById(jobId).populate('organization', 'name');
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  job.status = "hiring_stopped";
  await job.save();

  // Notify all applicants who haven't been hired or rejected
  const pendingApplications = await JobApplication.find({
    job: jobId,
    status: { $in: ["applied", "under_review", "interview", "offer_sent"] }
  })
  .select('applicant status')
  .populate('applicant', 'username name contact email');

  const notifications = pendingApplications.map(app => ({
    recipient: app.applicant._id,
    actor: actorId,
    type: "job_hiring_stopped",
    entity: { kind: "JobPosting", id: job.id },
    payload: { jobTitle: job.title },
  }));

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  // Send emails to pending applicants
  const companyName = job.organization?.name || 'the company';
  for (const app of pendingApplications) {
    const email = app.applicant.contact?.email || app.applicant.email;
    const studentName = app.applicant.name?.first || app.applicant.username;
    
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Application Update: Hiring Stopped - ${job.title}`,
          text: `Dear ${studentName},\n\nWe wanted to inform you that hiring has been stopped for the position of "${job.title}" at ${companyName}.\n\nYour application status: ${app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\nThank you for your interest in this position. We encourage you to explore other opportunities on LiaHub.\n\nBest regards,\n${companyName}`,
          html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
      <p>Hiring has been stopped for this position</p>
    </div>
    <div class="content">
      <p>Dear ${studentName},</p>
      <p>We wanted to inform you that hiring has been <strong>stopped</strong> for the position of <strong>"${job.title}"</strong> at <strong>${companyName}</strong>.</p>
      <p><strong>Your application status:</strong> ${app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
      <p>Thank you for your interest in this position. We encourage you to explore other opportunities on LiaHub.</p>
      <p style="margin-top: 30px;">Best regards,<br/><strong>${companyName}</strong></p>
    </div>
  </div>
</body>
</html>`
        });
      } catch (emailError) {
        console.error(`Failed to send hiring stopped email to ${email}:`, emailError);
      }
    }
  }

  return {
    success: true,
    job,
    notifiedApplicants: pendingApplications.length,
  };
};

const toggleWishlist = async ({ jobId, userId }) => {
  const job = await JobPosting.findById(jobId);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  const isWishlisted = job.wishlisted.includes(userId);
  
  if (isWishlisted) {
    job.wishlisted = job.wishlisted.filter(id => id.toString() !== userId.toString());
  } else {
    job.wishlisted.push(userId);
  }

  await job.save();
  
  return { 
    wishlisted: !isWishlisted,
    message: isWishlisted ? "Removed from wishlist" : "Added to wishlist"
  };
};

const getMyApplications = async ({ userId, status, type, page = 1, limit = 20 }) => {
  const query = { applicant: userId };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    JobApplication.find(query)
      .populate({
        path: "job",
        select: "title type organization location salary employmentType locationType deadline status openings tags description responsibilities requirements benefits seniority",
        populate: { path: "organization", select: "name type logo" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    JobApplication.countDocuments(query),
  ]);

  // Filter by job type if specified
  let filteredItems = items;
  if (type) {
    filteredItems = items.filter(app => app.job && app.job.type === type);
  }

  return {
    items: filteredItems.map(app => app.toJSON()),
    total: type ? filteredItems.length : total,
    page,
    pages: Math.ceil((type ? filteredItems.length : total) / limit),
  };
};

const getWishlistedJobs = async ({ userId, page = 1, limit = 20 }) => {
  const [items, total] = await Promise.all([
    JobPosting.find({ wishlisted: userId, status: { $ne: "draft" } })
      .populate("organization", "name type logo")
      .populate("createdBy", "username name media")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    JobPosting.countDocuments({ wishlisted: userId, status: { $ne: "draft" } }),
  ]);

  const jobIds = items.map((job) => job.id || job._id);
  const counts = await JobApplication.aggregate([
    { $match: { job: { $in: jobIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$job", total: { $sum: 1 } } },
  ]);

  const countMap = counts.reduce((acc, entry) => {
    acc[entry._id.toString()] = entry.total;
    return acc;
  }, {});

  const serialized = items.map((jobDoc) => {
    const job = jobDoc.toJSON();
    const jobId = job.id.toString();
    return {
      ...job,
      applicants: countMap[jobId] || 0,
      wishlisted: true,
    };
  });

  return { items: serialized, total, page, pages: Math.ceil(total / limit) };
};

const getJobDetails = async ({ jobId, currentUserId }) => {
  const job = await JobPosting.findById(jobId)
    .populate("organization", "name type logo description location")
    .populate("createdBy", "username name media");

  if (!job) {
    throw Object.assign(new Error("Job not found"), { status: 404 });
  }

  const applicantCount = await JobApplication.countDocuments({ job: jobId });
  
  let application = null;
  if (currentUserId) {
    application = await JobApplication.findOne({ 
      job: jobId, 
      applicant: currentUserId 
    }).select("status stage createdAt updatedAt timeline");
  }

  const jobData = job.toJSON();
  
  return {
    ...jobData,
    applicants: applicantCount,
    applied: Boolean(application),
    applicationStatus: application?.status,
    applicationStage: application?.stage,
    appliedAt: application?.createdAt,
    wishlisted: job.wishlisted.includes(currentUserId),
  };
};

const sendOfferLetter = async ({ applicationId, offerData, actorId }) => {
  const application = await JobApplication.findById(applicationId)
    .populate('applicant', 'username name contact email')
    .populate({
      path: 'job',
      select: 'title organization location employmentType',
      populate: { path: 'organization', select: 'name' }
    });

  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  // Check if applicant is selected first (or already has an offer)
  if (!['selected', 'interview', 'offer_sent'].includes(application.status)) {
    throw Object.assign(new Error("Applicant must be selected before sending offer letter"), { status: 400 });
  }

  // Check if this is an update to an existing offer
  const isUpdate = application.status === 'offer_sent' && application.offerLetter;

  application.status = "offer_sent";
  application.stage = "Offer";
  application.offerLetter = {
    sentOn: application.offerLetter?.sentOn || new Date(), // Keep original sent date if updating
    startDate: offerData.startDate,
    compensation: offerData.compensation,
    note: offerData.note,
    pdfUrl: offerData.pdfUrl || null,
    emailSent: true,
    updatedAt: isUpdate ? new Date() : undefined, // Track when offer was last updated
  };
  
  // Add timeline entry
  application.timeline.push({
    status: "offer_sent",
    comment: isUpdate ? "Offer letter updated" : "Offer letter sent",
    createdBy: actorId,
  });

  await application.save();

  // Create notification (only if new offer, not update)
  if (!isUpdate) {
    await Notification.create({
      recipient: application.applicant._id,
      actor: actorId,
      type: "job_offer",
      entity: { kind: "JobApplication", id: application.id },
      payload: {
        jobTitle: application.job.title,
        company: application.job.organization.name,
        startDate: offerData.startDate,
        compensation: offerData.compensation,
      },
    });
  }

  // Send email to student
  const recipientEmail = application.applicant.contact?.email || application.applicant.email;
  const studentName = application.applicant.name?.first || application.applicant.username;
  const companyName = application.job.organization.name;
  const jobTitle = application.job.title;

  if (recipientEmail) {
    try {
      await sendEmail({
        to: recipientEmail,
        subject: isUpdate 
          ? `Updated Job Offer from ${companyName} - ${jobTitle}`
          : `Job Offer from ${companyName} - ${jobTitle}`,
        text: `Dear ${studentName},\n\nCongratulations! We are pleased to offer you the position of ${jobTitle} at ${companyName}.\n\nOffer Details:\n- Position: ${jobTitle}\n- Start Date: ${new Date(offerData.startDate).toLocaleDateString()}\n- Compensation: ${offerData.compensation}\n- Location: ${application.job.location || 'TBD'}\n- Employment Type: ${application.job.employmentType || 'Full-time'}\n\n${offerData.note ? `Additional Note:\n${offerData.note}\n\n` : ''}Please log in to your LiaHub account to review and respond to this offer.\n\nBest regards,\n${companyName}`,
        html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .offer-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #667eea; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>You've received a job offer</p>
    </div>
    <div class="content">
      <p>Dear ${studentName},</p>
      <p>We are pleased to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      
      <div class="offer-details">
        <h3>Offer Details</h3>
        <div class="detail-row">
          <span class="detail-label">Position:</span>
          <span>${jobTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Company:</span>
          <span>${companyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Start Date:</span>
          <span>${new Date(offerData.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Compensation:</span>
          <span>${offerData.compensation}</span>
        </div>
        ${application.job.location ? `<div class="detail-row"><span class="detail-label">Location:</span><span>${application.job.location}</span></div>` : ''}
        ${application.job.employmentType ? `<div class="detail-row"><span class="detail-label">Employment Type:</span><span>${application.job.employmentType}</span></div>` : ''}
      </div>
      
      ${offerData.note ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;"><strong>Additional Note:</strong><p style="margin: 10px 0 0 0;">${offerData.note}</p></div>` : ''}
      
      <p>Please log in to your LiaHub account to review and respond to this offer.</p>
      
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="cta-button">View Offer</a>
      
      <p style="margin-top: 30px; color: #666;">Best regards,<br/><strong>${companyName}</strong></p>
    </div>
  </div>
</body>
</html>`
      });
    } catch (emailError) {
      console.error('Failed to send offer email:', emailError);
      // Don't fail the request if email fails
    }
  }

  return {
    success: true,
    application,
    recipientEmail,
    emailSent: !!recipientEmail,
  };
};

const getSelectedCandidates = async ({ jobId, page = 1, limit = 50 }) => {
  const query = { 
    job: jobId,
    status: { $in: ["offer_accepted", "hired"] }
  };

  const [items, total] = await Promise.all([
    JobApplication.find(query)
      .populate("applicant", "username name media contact social studentProfile followerCount followingCount")
      .populate({
        path: "job",
        select: "title type organization",
        populate: { path: "organization", select: "name type" },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    JobApplication.countDocuments(query),
  ]);

  return {
    items: items.map(app => app.toJSON()),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const acceptOffer = async ({ applicationId, applicantId }) => {
  const application = await JobApplication.findById(applicationId)
    .populate('applicant', 'username name email')
    .populate({
      path: 'job',
      select: 'title organization',
      populate: { path: 'organization', select: 'name contact' }
    });

  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  // Verify the user is the applicant
  if (application.applicant._id.toString() !== applicantId.toString()) {
    throw Object.assign(new Error("Unauthorized"), { status: 403 });
  }

  // Check if offer was sent
  if (!application.offerLetter || !application.offerLetter.sentOn) {
    throw Object.assign(new Error("No offer letter has been sent"), { status: 400 });
  }

  // Check if already accepted
  if (application.status === "offer_accepted") {
    throw Object.assign(new Error("Offer already accepted"), { status: 400 });
  }

  // Update status
  application.status = "offer_accepted";
  application.stage = "Accepted";
  application.offerLetter.acceptedOn = new Date();
  application.timeline.push({
    status: "offer_accepted",
    comment: "Offer accepted by candidate",
    createdBy: applicantId,
  });

  await application.save();

  // Create notification for company/organization
  const organizationUsers = await User.find({
    organization: application.organization,
    role: { $in: ['admin', 'employer', 'manager'] }
  }).select('_id');

  await Promise.all(
    organizationUsers.map(user =>
      Notification.create({
        recipient: user._id,
        actor: applicantId,
        type: "offer_accepted",
        entity: { kind: "JobApplication", id: application.id },
        payload: {
          candidateName: `${application.applicant.name.first} ${application.applicant.name.last}`,
          jobTitle: application.job.title,
          acceptedOn: application.offerLetter.acceptedOn,
        },
      })
    )
  );

  // Send email to company
  const companyEmail = application.job.organization.contact?.email;
  if (companyEmail) {
    try {
      await sendEmail({
        to: companyEmail,
        subject: `Offer Accepted - ${application.applicant.name.first} ${application.applicant.name.last}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: #dcfce7; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎉 Great News!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your offer has been accepted</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><strong>${application.applicant.name.first} ${application.applicant.name.last}</strong> has accepted your offer for the <strong>${application.job.title}</strong> position!</p>
      
      <div class="highlight">
        <h3 style="margin-top: 0;">Next Steps:</h3>
        <ul>
          <li>Contact the candidate to coordinate onboarding</li>
          <li>Prepare necessary documentation</li>
          <li>Schedule orientation and training</li>
        </ul>
      </div>

      <p><strong>Start Date:</strong> ${new Date(application.offerLetter.startDate).toLocaleDateString()}</p>
      <p><strong>Accepted On:</strong> ${new Date(application.offerLetter.acceptedOn).toLocaleDateString()}</p>
      
      <p style="margin-top: 30px;">Best regards,<br>LiaHub Team</p>
    </div>
    <div class="footer">
      <p>This is an automated notification from LiaHub</p>
    </div>
  </div>
</body>
</html>`
      });
    } catch (emailError) {
      console.error('Failed to send acceptance email:', emailError);
    }
  }

  return {
    success: true,
    application: application.toJSON(),
    message: "Offer accepted successfully"
  };
};

module.exports = {
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  updateApplicationStatus,
  listApplications,
  stopHiring,
  toggleWishlist,
  getMyApplications,
  getWishlistedJobs,
  getJobDetails,
  sendOfferLetter,
  getSelectedCandidates,
  acceptOffer,
};
