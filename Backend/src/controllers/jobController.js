const { body, param, query } = require("express-validator");
const jobService = require("../services/jobService");

const validateListJobs = () => [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })];

const listJobs = async (req, res, next) => {
  try {
    const result = await jobService.listJobs({
      filters: {
        organization: req.query.organization,
        type: req.query.type,
        status: req.query.status,
        search: req.query.search,
      },
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      currentUserId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateCreateJob = () => [
  body("title").notEmpty(),
  body("description").notEmpty(),
  body("organization").isMongoId(),
  body("type").optional().isIn(["job", "internship", "lia"]),
  body("deadline").optional().isISO8601(),
];

const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob({ payload: req.body, actorId: req.user.id });
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

const validateUpdateJob = () => [param("jobId").isMongoId()];

const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob({ jobId: req.params.jobId, payload: req.body });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

const validateApplyJob = () => [param("jobId").isMongoId()];

const applyJob = async (req, res, next) => {
  try {
    const application = await jobService.applyForJob({
      jobId: req.params.jobId,
      applicantId: req.user.id,
      organizationId: req.user.organization,
      payload: req.body,
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

const validateUpdateApplication = () => [
  param("applicationId").isMongoId(),
  body("status").isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "hired", "rejected", "withdrawn"]),
];

const updateApplication = async (req, res, next) => {
  try {
    const application = await jobService.updateApplicationStatus({
      applicationId: req.params.applicationId,
      status: req.body.status,
      actorId: req.user.id,
      comment: req.body.comment,
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
};

const validateListApplications = () => [
  param("jobId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("status").optional().isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "hired", "rejected", "withdrawn"]),
];

const listApplications = async (req, res, next) => {
  try {
    const result = await jobService.listApplications({
      jobId: req.params.jobId,
      status: req.query.status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateDeleteJob = () => [param("jobId").isMongoId()];

const deleteJob = async (req, res, next) => {
  try {
    const result = await jobService.deleteJob({ 
      jobId: req.params.jobId, 
      actorId: req.user.id 
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateStopHiring = () => [param("jobId").isMongoId()];

const stopHiring = async (req, res, next) => {
  try {
    const job = await jobService.stopHiring({ 
      jobId: req.params.jobId, 
      actorId: req.user.id 
    });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

const validateToggleWishlist = () => [param("jobId").isMongoId()];

const toggleWishlist = async (req, res, next) => {
  try {
    const result = await jobService.toggleWishlist({ 
      jobId: req.params.jobId, 
      userId: req.user.id 
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetMyApplications = () => [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "hired", "rejected", "withdrawn"]),
  query("type").optional().isIn(["job", "internship", "lia"]),
];

const getMyApplications = async (req, res, next) => {
  try {
    const result = await jobService.getMyApplications({
      userId: req.user.id,
      status: req.query.status,
      type: req.query.type,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetWishlistedJobs = () => [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const getWishlistedJobs = async (req, res, next) => {
  try {
    const result = await jobService.getWishlistedJobs({
      userId: req.user.id,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetJobDetails = () => [param("jobId").isMongoId()];

const getJobDetails = async (req, res, next) => {
  try {
    const job = await jobService.getJobDetails({
      jobId: req.params.jobId,
      currentUserId: req.user.id,
    });
    res.json(job);
  } catch (error) {
    next(error);
  }
};

const validateSendOfferLetter = () => [
  param("applicationId").isMongoId(),
  body("startDate").notEmpty(),
  body("compensation").notEmpty(),
  body("pdfUrl").optional({ checkFalsy: true }).isURL({ require_tld: false, require_protocol: true }),
  body("note").optional(),
];

const sendOfferLetter = async (req, res, next) => {
  try {
    const result = await jobService.sendOfferLetter({
      applicationId: req.params.applicationId,
      offerData: {
        startDate: req.body.startDate,
        compensation: req.body.compensation,
        note: req.body.note,
        pdfUrl: req.body.pdfUrl,
      },
      actorId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetSelectedCandidates = () => [
  param("jobId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
];

const getSelectedCandidates = async (req, res, next) => {
  try {
    const result = await jobService.getSelectedCandidates({
      jobId: req.params.jobId,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateAcceptOffer = () => [param("applicationId").isMongoId()];

const acceptOffer = async (req, res, next) => {
  try {
    const result = await jobService.acceptOffer({
      applicationId: req.params.applicationId,
      applicantId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateListJobs,
  listJobs,
  validateCreateJob,
  createJob,
  validateUpdateJob,
  updateJob,
  validateDeleteJob,
  deleteJob,
  validateApplyJob,
  applyJob,
  validateUpdateApplication,
  updateApplication,
  validateListApplications,
  listApplications,
  validateStopHiring,
  stopHiring,
  validateToggleWishlist,
  toggleWishlist,
  validateGetMyApplications,
  getMyApplications,
  validateGetWishlistedJobs,
  getWishlistedJobs,
  validateGetJobDetails,
  getJobDetails,
  validateSendOfferLetter,
  sendOfferLetter,
  validateGetSelectedCandidates,
  getSelectedCandidates,
  validateAcceptOffer,
  acceptOffer,
};
