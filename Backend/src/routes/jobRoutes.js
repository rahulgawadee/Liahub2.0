const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const jobController = require("../controllers/jobController");
const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

router.use(auth);

// Public job listings (all authenticated users)
router.get("/", validate(jobController.validateListJobs()), jobController.listJobs);
router.get("/:jobId", validate(jobController.validateGetJobDetails()), jobController.getJobDetails);

// Student/Applicant routes
router.post(
  "/:jobId/apply",
  validate(jobController.validateApplyJob()),
  jobController.applyJob
);
router.post(
  "/:jobId/wishlist",
  validate(jobController.validateToggleWishlist()),
  jobController.toggleWishlist
);
router.get(
  "/my/applications",
  validate(jobController.validateGetMyApplications()),
  jobController.getMyApplications
);
router.get(
  "/my/wishlist",
  validate(jobController.validateGetWishlistedJobs()),
  jobController.getWishlistedJobs
);
router.post(
  "/applications/:applicationId/accept-offer",
  validate(jobController.validateAcceptOffer()),
  jobController.acceptOffer
);

// Employer/Manager routes (require MANAGE_JOBS permission)
router.post(
  "/",
  validate(jobController.validateCreateJob()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.createJob
);
router.put(
  "/:jobId",
  validate(jobController.validateUpdateJob()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.updateJob
);
router.delete(
  "/:jobId",
  validate(jobController.validateDeleteJob()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.deleteJob
);
router.post(
  "/:jobId/stop-hiring",
  validate(jobController.validateStopHiring()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.stopHiring
);
router.get(
  "/:jobId/applications",
  validate(jobController.validateListApplications()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.listApplications
);
router.get(
  "/:jobId/selected",
  validate(jobController.validateGetSelectedCandidates()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.getSelectedCandidates
);
router.post(
  "/applications/:applicationId/status",
  validate(jobController.validateUpdateApplication()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.updateApplication
);
router.post(
  "/applications/:applicationId/offer",
  validate(jobController.validateSendOfferLetter()),
  authorize(PERMISSIONS.MANAGE_JOBS),
  jobController.sendOfferLetter
);

module.exports = router;
