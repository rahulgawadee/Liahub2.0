const { body, param, query } = require("express-validator");
const liaService = require("../services/liaService");

const validateListLIAs = () => [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })];

const listLIAs = async (req, res, next) => {
  try {
    const result = await liaService.listLIAs({
      filters: {
        organization: req.query.organization,
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

const validateCreateLIA = () => [
  body("title").notEmpty(),
  body("description").notEmpty(),
  body("organization").isMongoId(),
  body("deadline").optional().isISO8601(),
];

const createLIA = async (req, res, next) => {
  try {
    const lia = await liaService.createLIA({ payload: req.body, actorId: req.user.id });
    res.status(201).json(lia);
  } catch (error) {
    next(error);
  }
};

const validateUpdateLIA = () => [param("liaId").isMongoId()];

const updateLIA = async (req, res, next) => {
  try {
    const lia = await liaService.updateLIA({ liaId: req.params.liaId, payload: req.body });
    res.json(lia);
  } catch (error) {
    next(error);
  }
};

const validateApplyLIA = () => [param("liaId").isMongoId()];

const applyLIA = async (req, res, next) => {
  try {
    const application = await liaService.applyForLIA({
      liaId: req.params.liaId,
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
  body("status").isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "placed", "rejected", "withdrawn"]),
];

const updateApplication = async (req, res, next) => {
  try {
    const application = await liaService.updateApplicationStatus({
      applicationId: req.params.applicationId,
      status: req.body.status,
      stage: req.body.stage,
      notes: req.body.notes,
      actorId: req.user.id,
      comment: req.body.comment,
    });
    res.json(application);
  } catch (error) {
    next(error);
  }
};

const validateListApplications = () => [
  param("liaId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("status").optional().isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "placed", "rejected", "withdrawn"]),
];

const listApplications = async (req, res, next) => {
  try {
    const result = await liaService.listApplications({
      liaId: req.params.liaId,
      status: req.query.status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateDeleteLIA = () => [param("liaId").isMongoId()];

const deleteLIA = async (req, res, next) => {
  try {
    const result = await liaService.deleteLIA({ 
      liaId: req.params.liaId, 
      actorId: req.user.id 
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateStopHiring = () => [param("liaId").isMongoId()];

const stopHiring = async (req, res, next) => {
  try {
    const lia = await liaService.stopHiring({ 
      liaId: req.params.liaId, 
      actorId: req.user.id 
    });
    res.json(lia);
  } catch (error) {
    next(error);
  }
};

const validateToggleWishlist = () => [param("liaId").isMongoId()];

const toggleWishlist = async (req, res, next) => {
  try {
    const result = await liaService.toggleWishlist({ 
      liaId: req.params.liaId, 
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
  query("status").optional().isIn(["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "placed", "rejected", "withdrawn"]),
];

const getMyApplications = async (req, res, next) => {
  try {
    const result = await liaService.getMyApplications({
      userId: req.user.id,
      status: req.query.status,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetWishlistedLIAs = () => [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const getWishlistedLIAs = async (req, res, next) => {
  try {
    const result = await liaService.getWishlistedLIAs({
      userId: req.user.id,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetLIADetails = () => [param("liaId").isMongoId()];

const getLIADetails = async (req, res, next) => {
  try {
    const lia = await liaService.getLIADetails({
      liaId: req.params.liaId,
      currentUserId: req.user.id,
    });
    res.json(lia);
  } catch (error) {
    next(error);
  }
};

const validateSendOfferLetter = () => [
  param("applicationId").isMongoId(),
  body("startDate").notEmpty(),
  body("duration").notEmpty(),
  body("pdfUrl").optional({ checkFalsy: true }).isURL({ require_tld: false, require_protocol: true }),
  body("note").optional(),
];

const sendOfferLetter = async (req, res, next) => {
  try {
    const result = await liaService.sendOfferLetter({
      applicationId: req.params.applicationId,
      offerData: {
        startDate: req.body.startDate,
        duration: req.body.duration,
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
  param("liaId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
];

const getSelectedCandidates = async (req, res, next) => {
  try {
    const result = await liaService.getSelectedCandidates({
      liaId: req.params.liaId,
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
    const result = await liaService.acceptOffer({
      applicationId: req.params.applicationId,
      applicantId: req.user.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getCompanyApplications = async (req, res, next) => {
  try {
    const result = await liaService.getCompanyApplications(req.user.id);
    res.json({ items: result });
  } catch (error) {
    next(error);
  }
};

const getSchoolApplications = async (req, res, next) => {
  try {
    const result = await liaService.getSchoolApplications(req.user.id);
    res.json({ items: result });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const result = await liaService.updateApplicationStatus({
      liaId: req.params.liaId,
      applicationId: req.params.applicationId,
      status: req.body.status,
      stage: req.body.stage,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateListLIAs,
  listLIAs,
  validateCreateLIA,
  createLIA,
  validateUpdateLIA,
  updateLIA,
  validateDeleteLIA,
  deleteLIA,
  validateApplyLIA,
  applyLIA,
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
  validateGetWishlistedLIAs,
  getWishlistedLIAs,
  validateGetLIADetails,
  getLIADetails,
  validateSendOfferLetter,
  sendOfferLetter,
  validateGetSelectedCandidates,
  getSelectedCandidates,
  validateAcceptOffer,
  acceptOffer,
  getCompanyApplications,
  getSchoolApplications,
  updateApplicationStatus,
};
