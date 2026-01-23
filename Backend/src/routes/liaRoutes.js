const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const liaController = require("../controllers/liaController");
const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

router.use(auth);

// Public LIA listings (all authenticated users)
router.get("/", validate(liaController.validateListLIAs()), liaController.listLIAs);
router.get("/:liaId", validate(liaController.validateGetLIADetails()), liaController.getLIADetails);

// Company/School specific routes
router.get(
  "/company/applications",
  authorize(PERMISSIONS.MANAGE_JOBS),
  liaController.getCompanyApplications
);
router.get(
  "/school/applications",
  liaController.getSchoolApplications
);

// Student/Applicant routes
router.post(
  "/:liaId/apply",
  validate(liaController.validateApplyLIA()),
  liaController.applyLIA
);
router.post(
  "/:liaId/wishlist",
  validate(liaController.validateToggleWishlist()),
  liaController.toggleWishlist
);
router.get(
  "/my/applications",
  validate(liaController.validateGetMyApplications()),
  liaController.getMyApplications
);
router.get(
  "/my/wishlist",
  validate(liaController.validateGetWishlistedLIAs()),
  liaController.getWishlistedLIAs
);
router.post(
  "/applications/:applicationId/accept-offer",
  validate(liaController.validateAcceptOffer()),
  liaController.acceptOffer
);

// Employer/Manager routes (Requires MANAGE_JOBS Permission)
router.post(
  "/",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateCreateLIA()),
  liaController.createLIA
);
router.put(
  "/:liaId",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateUpdateLIA()),
  liaController.updateLIA
);
router.delete(
  "/:liaId",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateDeleteLIA()),
  liaController.deleteLIA
);
router.post(
  "/:liaId/stop-hiring",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateStopHiring()),
  liaController.stopHiring
);

// Application management routes (Requires MANAGE_JOBS Permission)
router.get(
  "/:liaId/applications",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateListApplications()),
  liaController.listApplications
);
router.get(
  "/:liaId/selected",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateGetSelectedCandidates()),
  liaController.getSelectedCandidates
);
router.put(
  "/:liaId/applications/:applicationId/status",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateUpdateApplication()),
  liaController.updateApplicationStatus
);
router.post(
  "/:liaId/applications/:applicationId/offer",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateSendOfferLetter()),
  liaController.sendOfferLetter
);
router.post(
  "/applications/:applicationId/status",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateUpdateApplication()),
  liaController.updateApplication
);
router.post(
  "/applications/:applicationId/offer",
  authorize(PERMISSIONS.MANAGE_JOBS),
  validate(liaController.validateSendOfferLetter()),
  liaController.sendOfferLetter
);

module.exports = router;
