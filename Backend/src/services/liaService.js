const mongoose = require("mongoose");
const LIAPosting = require("../models/LIAPosting");
const LIAApplication = require("../models/LIAApplication");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

// Helper function to automatically close LIAs past deadline
const checkAndUpdateExpiredLIAs = async () => {
  const now = new Date();
  const expiredLIAs = await LIAPosting.find({
    status: "open",
    deadline: { $lt: now }
  });

  if (expiredLIAs.length > 0) {
    const expiredLIAIds = expiredLIAs.map(l => l._id);
    
    // Update all expired LIAs to hiring_stopped
    await LIAPosting.updateMany(
      { _id: { $in: expiredLIAIds } },
      { status: "hiring_stopped" }
    );

    // Notify applicants for each expired LIA
    for (const lia of expiredLIAs) {
      const applications = await LIAApplication.find({ 
        lia: lia._id,
        status: { $in: ['applied', 'under_review', 'interview'] }
      });

      if (applications.length > 0) {
        const notifications = applications.map(app => ({
          recipient: app.applicant,
          type: "lia_application_stopped",
          message: `The application deadline for LIA "${lia.title}" has passed. Placement process has been stopped.`,
          metadata: { liaId: lia._id, liaTitle: lia.title },
        }));

        await Notification.insertMany(notifications);
      }
    }
  }
};

const listLIAs = async ({ filters = {}, page = 1, limit = 20, currentUserId }) => {
  // Auto-check and update expired LIAs
  await checkAndUpdateExpiredLIAs();

  const query = {};
  if (filters.organization) query.organization = filters.organization;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const [items, total] = await Promise.all([
    LIAPosting.find(query)
      .populate("organization", "name type")
      .populate("createdBy", "username name media")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    LIAPosting.countDocuments(query),
  ]);

  if (items.length === 0) {
    return { items, total, page, pages: Math.ceil(total / limit) };
  }

  const liaIds = items.map((lia) => lia.id || lia._id);

  const [counts, userApplications] = await Promise.all([
    LIAApplication.aggregate([
      { $match: { lia: { $in: liaIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$lia", total: { $sum: 1 } } },
    ]),
    currentUserId
      ? LIAApplication.find({ lia: { $in: liaIds }, applicant: currentUserId })
          .select("lia status createdAt updatedAt")
      : [],
  ]);

  const countMap = counts.reduce((acc, entry) => {
    acc[entry._id.toString()] = entry.total;
    return acc;
  }, {});

  const appliedMap = new Map();
  userApplications.forEach((application) => {
    appliedMap.set(application.lia.toString(), application);
  });

  const serialized = items.map((liaDoc) => {
    const lia = liaDoc.toJSON();
    const liaId = lia.id.toString();
    const application = appliedMap.get(liaId);

    return {
      ...lia,
      applicantsCount: countMap[liaId] || 0,
      applicants: countMap[liaId] || 0,
      applied: Boolean(application),
      applicationStatus: application?.status,
      appliedAt: application?.createdAt,
      isDeadlinePassed: lia.deadline && new Date(lia.deadline) < new Date(),
    };
  });

  return { items: serialized, total, page, pages: Math.ceil(total / limit) };
};

// Create new LIA posting with organization populated
const createLIA = async ({ payload, actorId }) => {
  const lia = await LIAPosting.create({ ...payload, createdBy: actorId });
  await lia.populate('organization', 'name type');
  return lia;
};

const updateLIA = async ({ liaId, payload }) => {
  const lia = await LIAPosting.findByIdAndUpdate(liaId, payload, { new: true });
  if (!lia) {
    throw Object.assign(new Error("LIA not found"), { status: 404 });
  }
  return lia;
};

const applyForLIA = async ({ liaId, applicantId, organizationId, payload }) => {
  try {
    console.log('📝 [Backend] Student applying to LIA:', liaId, 'Student ID:', applicantId);
    
    // Find the LIA first
    const lia = await LIAPosting.findById(liaId);
    if (!lia) {
      throw Object.assign(new Error("LIA not found"), { status: 404 });
    }
    if (lia.status !== "open") {
      throw Object.assign(new Error("Applications closed"), { status: 400 });
    }
    if (lia.deadline && lia.deadline < new Date()) {
      throw Object.assign(new Error("Deadline passed"), { status: 400 });
    }

    // Use LIA's organization if applicant doesn't have one
    const applicationOrganization = organizationId || lia.organization;

    console.log('📝 [Backend] Creating application - Organization:', applicationOrganization);

    // Create the application
    const application = await LIAApplication.create({
      lia: lia.id,
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
    
    console.log('✅ [Backend] Application created successfully! ID:', application._id);

    // Populate fields before returning
    await application.populate([
      { path: "lia", populate: { path: "organization", select: "name type" } },
      { path: "applicant", select: "username name media" },
    ]);

    // Create notification for organization admins
    await Notification.create({
      recipient: lia.createdBy,
      type: "lia_application",
      actor: applicantId,
      message: `New application received for LIA: ${lia.title}`,
      entity: { kind: "LIAApplication", id: application._id },
    });

    return application;
  } catch (error) {
    console.error('❌ [Backend] Application submission failed:', error.message);
    if (error.code === 11000) {
      throw Object.assign(
        new Error("You have already applied to this LIA placement"), 
        { status: 400 }
      );
    }
    throw error;
  }
};

const updateApplicationStatus = async ({ applicationId, status, stage, notes, comment, actorId }) => {
  const application = await LIAApplication.findById(applicationId);
  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  application.status = status;
  if (stage) application.stage = stage;
  if (notes !== undefined) application.notes = notes;

  application.timeline.push({
    status,
    comment: comment || `Status updated to ${status}`,
    createdBy: actorId,
  });

  await application.save();

  await application.populate([
    { path: "lia", populate: { path: "organization", select: "name type" } },
    { path: "applicant", select: "username name media" },
  ]);

  // Create notification for applicant
  await Notification.create({
    recipient: application.applicant,
    type: "lia_status_update",
    actor: actorId,
    message: `Your LIA application status has been updated to: ${status}`,
    entity: { kind: "LIAApplication", id: application._id },
  });

  return application;
};

const listApplications = async ({ liaId, status, page = 1, limit = 50 }) => {
  const query = { lia: liaId };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    LIAApplication.find(query)
      .populate("applicant", "username name media contact studentProfile")
      .populate("lia", "title organization")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    LIAApplication.countDocuments(query),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
};

const deleteLIA = async ({ liaId, actorId }) => {
  const lia = await LIAPosting.findById(liaId);
  if (!lia) {
    throw Object.assign(new Error("LIA not found"), { status: 404 });
  }

  // Check if there are any applications
  const applicationCount = await LIAApplication.countDocuments({ lia: liaId });
  if (applicationCount > 0) {
    throw Object.assign(
      new Error("Cannot delete LIA with existing applications. Please close it instead."),
      { status: 400 }
    );
  }

  await LIAPosting.findByIdAndDelete(liaId);
  return { message: "LIA deleted successfully" };
};

const stopHiring = async ({ liaId, actorId }) => {
  const lia = await LIAPosting.findByIdAndUpdate(
    liaId,
    { status: "hiring_stopped" },
    { new: true }
  );

  if (!lia) {
    throw Object.assign(new Error("LIA not found"), { status: 404 });
  }

  // Notify all pending applicants
  const pendingApplications = await LIAApplication.find({
    lia: liaId,
    status: { $in: ["applied", "under_review", "interview"] },
  });

  if (pendingApplications.length > 0) {
    const notifications = pendingApplications.map((app) => ({
      recipient: app.applicant,
      type: "lia_hiring_stopped",
      message: `The LIA placement "${lia.title}" has stopped accepting applications.`,
      entity: { kind: "LIAPosting", id: lia._id },
    }));

    await Notification.insertMany(notifications);
  }

  return lia;
};

const toggleWishlist = async ({ liaId, userId }) => {
  const lia = await LIAPosting.findById(liaId);
  if (!lia) {
    throw Object.assign(new Error("LIA not found"), { status: 404 });
  }

  const isWishlisted = lia.wishlisted.includes(userId);

  if (isWishlisted) {
    lia.wishlisted = lia.wishlisted.filter((id) => id.toString() !== userId.toString());
  } else {
    lia.wishlisted.push(userId);
  }

  await lia.save();

  return { wishlisted: !isWishlisted };
};

const getMyApplications = async ({ userId, status, page = 1, limit = 20 }) => {
  const query = { applicant: userId };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    LIAApplication.find(query)
      .populate({
        path: "lia",
        populate: { path: "organization", select: "name type logo" },
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    LIAApplication.countDocuments(query),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
};

const getWishlistedLIAs = async ({ userId, page = 1, limit = 20 }) => {
  const query = { wishlisted: userId };

  const [items, total] = await Promise.all([
    LIAPosting.find(query)
      .populate("organization", "name type logo")
      .populate("createdBy", "username name media")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    LIAPosting.countDocuments(query),
  ]);

  // Add application counts and user's application status
  const liaIds = items.map((lia) => lia.id || lia._id);
  const [counts, userApplications] = await Promise.all([
    LIAApplication.aggregate([
      { $match: { lia: { $in: liaIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$lia", total: { $sum: 1 } } },
    ]),
    LIAApplication.find({ lia: { $in: liaIds }, applicant: userId })
      .select("lia status createdAt"),
  ]);

  const countMap = counts.reduce((acc, entry) => {
    acc[entry._id.toString()] = entry.total;
    return acc;
  }, {});

  const appliedMap = new Map();
  userApplications.forEach((app) => {
    appliedMap.set(app.lia.toString(), app);
  });

  const serialized = items.map((liaDoc) => {
    const lia = liaDoc.toJSON();
    const liaId = lia.id.toString();
    const application = appliedMap.get(liaId);

    return {
      ...lia,
      applicantsCount: countMap[liaId] || 0,
      applicants: countMap[liaId] || 0,
      applied: Boolean(application),
      applicationStatus: application?.status,
      appliedAt: application?.createdAt,
      wishlisted: true,
    };
  });

  return { items: serialized, total, page, pages: Math.ceil(total / limit) };
};

const getLIADetails = async ({ liaId, currentUserId }) => {
  const lia = await LIAPosting.findById(liaId)
    .populate("organization", "name type description contact logo")
    .populate("createdBy", "username name media");

  if (!lia) {
    throw Object.assign(new Error("LIA not found"), { status: 404 });
  }

  // Get application count
  const applicantsCount = await LIAApplication.countDocuments({ lia: liaId });

  // Check if current user has applied
  let userApplication = null;
  if (currentUserId) {
    userApplication = await LIAApplication.findOne({
      lia: liaId,
      applicant: currentUserId,
    });
  }

  const liaData = lia.toJSON();

  return {
    ...liaData,
    applicantsCount,
    applicants: applicantsCount,
    applied: Boolean(userApplication),
    applicationStatus: userApplication?.status,
    appliedAt: userApplication?.createdAt,
    wishlisted: currentUserId ? lia.wishlisted.includes(currentUserId) : false,
  };
};

const sendOfferLetter = async ({ applicationId, offerData, actorId }) => {
  const application = await LIAApplication.findById(applicationId).populate("lia applicant");

  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  if (!["selected", "offer_sent"].includes(application.status)) {
    throw Object.assign(
      new Error("Can only send offers to selected candidates"),
      { status: 400 }
    );
  }

  application.offerLetter = {
    sentOn: new Date(),
    startDate: offerData.startDate,
    duration: offerData.duration,
    note: offerData.note,
    pdfUrl: offerData.pdfUrl,
    emailSent: false,
  };

  application.status = "offer_sent";
  application.timeline.push({
    status: "offer_sent",
    comment: "Offer letter sent",
    createdBy: actorId,
  });

  await application.save();

  // Create notification
  await Notification.create({
    recipient: application.applicant._id,
    type: "lia_offer",
    actor: actorId,
    message: `You have received an offer for LIA: ${application.lia.title}`,
    entity: { kind: "LIAApplication", id: application._id },
  });

  // Send email (optional)
  try {
    if (application.applicant.email) {
      await sendEmail({
        to: application.applicant.email,
        subject: `LIA Offer: ${application.lia.title}`,
        html: `
          <h2>Congratulations!</h2>
          <p>You have received an offer for the LIA placement: <strong>${application.lia.title}</strong></p>
          <p><strong>Start Date:</strong> ${new Date(offerData.startDate).toLocaleDateString()}</p>
          <p><strong>Duration:</strong> ${offerData.duration}</p>
          ${offerData.note ? `<p><strong>Note:</strong> ${offerData.note}</p>` : ''}
          <p>Please log in to your account to accept or decline this offer.</p>
        `,
      });
      application.offerLetter.emailSent = true;
      await application.save();
    }
  } catch (emailError) {
    console.error("Failed to send offer email:", emailError);
  }

  return application;
};

const getSelectedCandidates = async ({ liaId, page = 1, limit = 50 }) => {
  const query = {
    lia: liaId,
    status: { $in: ["selected", "offer_sent", "offer_accepted", "placed"] },
  };

  const [items, total] = await Promise.all([
    LIAApplication.find(query)
      .populate("applicant", "username name media contact studentProfile")
      .populate("lia", "title organization")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ "offerLetter.sentOn": -1, updatedAt: -1 }),
    LIAApplication.countDocuments(query),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
};

const acceptOffer = async ({ applicationId, applicantId }) => {
  const application = await LIAApplication.findOne({
    _id: applicationId,
    applicant: applicantId,
  }).populate("lia");

  if (!application) {
    throw Object.assign(new Error("Application not found"), { status: 404 });
  }

  if (application.status !== "offer_sent") {
    throw Object.assign(new Error("No pending offer to accept"), { status: 400 });
  }

  if (!application.offerLetter || !application.offerLetter.sentOn) {
    throw Object.assign(new Error("No offer letter found"), { status: 400 });
  }

  application.status = "offer_accepted";
  application.offerLetter.acceptedOn = new Date();
  application.timeline.push({
    status: "offer_accepted",
    comment: "Offer accepted by student",
    createdBy: applicantId,
  });

  await application.save();

  // Notify organization
  await Notification.create({
    recipient: application.lia.createdBy,
    type: "offer_accepted",
    actor: applicantId,
    message: `Offer accepted for LIA: ${application.lia.title}`,
    entity: { kind: "LIAApplication", id: application._id },
  });

  return application;
};

const getCompanyApplications = async (userId) => {
  const user = await User.findById(userId).populate('organization');
  if (!user || !user.organization) {
    throw Object.assign(new Error('Organization not found'), { status: 404 });
  }

  const lias = await LIAPosting.find({ 
    organization: user.organization._id 
  })
  .populate('organization', 'name logo description')
  .lean();

  // For each LIA, fetch its applications
  const liasWithApplications = await Promise.all(
    lias.map(async (lia) => {
      const applications = await LIAApplication.find({ lia: lia._id })
        .populate('applicant', 'name email profilePicture organization')
        .populate({
          path: 'applicant',
          populate: {
            path: 'organization',
            select: 'name type'
          }
        })
        .sort({ createdAt: -1 })
        .lean();

      return {
        ...lia,
        id: lia._id.toString(),
        applications: applications.map(app => ({
          id: app._id.toString(),
          lia: app.lia,
          status: app.status,
          stage: app.stage,
          coverLetter: app.coverLetter,
          resumeUrl: app.resumeUrl,
          notes: app.notes,
          offerLetter: app.offerLetter,
          studentName: app.applicant?.name 
            ? `${app.applicant.name.first} ${app.applicant.name.last}`.trim()
            : 'Unknown',
          studentEmail: app.applicant?.email || '',
          institute: app.applicant?.organization?.name || '',
          profileScore: app.profileScore,
          submittedOn: app.appliedAt 
            ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : app.createdAt 
              ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
          appliedAt: app.appliedAt 
            ? new Date(app.appliedAt).toISOString()
            : app.createdAt 
              ? new Date(app.createdAt).toISOString()
              : null,
          createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : null,
          updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : null,
        })),
        applicants: applications.length,
      };
    })
  );

  return liasWithApplications;
};

const getSchoolApplications = async (userId) => {
  console.log('🏫 [Backend] getSchoolApplications called for userId:', userId);
  
  const user = await User.findById(userId).populate('organization');
  console.log('🏫 [Backend] User found:', user?.name, 'Organization:', user?.organization?.name);
  
  if (!user || !user.organization) {
    throw Object.assign(new Error('Organization not found'), { status: 404 });
  }

  // Find all students from this school
  const students = await User.find({ 
    organization: user.organization._id,
    entity: 'student'
  }).select('_id');
  
  console.log('🏫 [Backend] Found', students.length, 'students in this school');
  const studentIds = students.map(s => s._id);

  // **NEW APPROACH**: Fetch ALL active LIAs (not just ones with applications)
  const allLIAs = await LIAPosting.find({ 
    status: { $in: ['open', 'hiring_stopped'] }
  })
  .populate('organization', 'name logo')
  .populate('createdBy', 'name')
  .sort({ createdAt: -1 })
  .lean();

  console.log('🏫 [Backend] Found', allLIAs.length, 'total active LIAs');

  // Find all applications from this school's students
  const applications = await LIAApplication.find({
    applicant: { $in: studentIds }
  })
  .populate('applicant', 'name email profilePicture organization')
  .sort({ createdAt: -1 })
  .lean();
  
  console.log('🏫 [Backend] Found', applications.length, 'applications from school students');

  // Group applications by LIA ID
  const applicationsByLia = {};
  applications.forEach(app => {
    const liaId = app.lia.toString();
    if (!applicationsByLia[liaId]) {
      applicationsByLia[liaId] = [];
    }
    applicationsByLia[liaId].push({
      id: app._id.toString(),
      status: app.status,
      stage: app.stage,
      coverLetter: app.coverLetter,
      resumeUrl: app.resumeUrl,
      notes: app.notes,
      offerLetter: app.offerLetter,
      studentName: app.applicant?.name 
        ? `${app.applicant.name.first} ${app.applicant.name.last}`.trim()
        : 'Unknown',
      studentEmail: app.applicant?.email || '',
      institute: user.organization.name,
      profileScore: app.profileScore,
      submittedOn: app.appliedAt 
        ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : app.createdAt 
          ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
      appliedAt: app.appliedAt 
        ? new Date(app.appliedAt).toISOString()
        : app.createdAt 
          ? new Date(app.createdAt).toISOString()
          : null,
      createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : null,
      updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : null,
      timeline: app.timeline || [],
    });
  });

  // Map ALL LIAs with their applications (if any)
  const result = allLIAs.map(lia => {
    const liaId = lia._id.toString();
    const liaApplications = applicationsByLia[liaId] || [];
    
    return {
      ...lia,
      id: liaId,
      postingId: liaId,
      company: lia.organization?.name || 'Unknown Company',
      applications: liaApplications,
      applicants: liaApplications.length,
      postedOn: lia.createdAt 
        ? new Date(lia.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A',
    };
  });

  console.log('🏫 [Backend] Returning', result.length, 'LIA postings');
  console.log('🏫 [Backend] LIAs with applications:', result.filter(l => l.applications.length > 0).length);
  console.log('🏫 [Backend] LIAs without applications:', result.filter(l => l.applications.length === 0).length);
  
  return result;
};

module.exports = {
  listLIAs,
  createLIA,
  updateLIA,
  deleteLIA,
  applyForLIA,
  updateApplicationStatus,
  listApplications,
  stopHiring,
  toggleWishlist,
  getMyApplications,
  getWishlistedLIAs,
  getLIADetails,
  sendOfferLetter,
  getSelectedCandidates,
  acceptOffer,
  getCompanyApplications,
  getSchoolApplications,
};
