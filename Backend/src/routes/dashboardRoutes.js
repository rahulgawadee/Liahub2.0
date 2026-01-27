const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { PERMISSIONS } = require("../constants/permissions");
const dashboardController = require("../controllers/dashboardController");
const uploadExcel = require("../config/multerExcel");

const router = express.Router();

// Allow education managers to edit their own profile rows without requiring full dashboard edit permission
const allowSelfEducationManagerEdit = (req, res, next) => {
  const isEducationManager = Array.isArray(req.user?.roles) && req.user.roles.includes('education_manager');
  const isSelf = req.body?.type === 'education_manager' && req.user?._id && String(req.user._id) === String(req.params.id);
  if (isEducationManager && isSelf) return next();
  return authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD)(req, res, next);
};

router.use(auth);

router.get("/student", dashboardController.getStudentDashboard);
router.get(
  "/school",
  authorize(PERMISSIONS.VIEW_SCHOOL_DASHBOARD),
  dashboardController.getSchoolDashboard
);

// LIA Essentials routes
router.get(
  "/lia-essentials",
  dashboardController.getLiaEssentials
);
router.put(
  "/lia-essentials",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.updateLiaEssential
);

// Legacy route for backward compatibility
router.put(
  "/school/lia",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.updateLiaEssential
);

router.post(
  "/school/records",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.createSchoolRecord
);

router.put(
  "/school/records/:id",
  allowSelfEducationManagerEdit,
  dashboardController.updateSchoolRecord
);

router.delete(
  "/school/records/:id",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.deleteSchoolRecord
);

router.post(
  "/company/assignments/:id/confirm",
  authorize(PERMISSIONS.MANAGE_LIA),
  dashboardController.confirmStudentAssignment
);

router.post(
  "/company/assignments/:id/reject",
  authorize(PERMISSIONS.MANAGE_LIA),
  dashboardController.rejectStudentAssignment
);

router.post(
  "/school/upload-students-excel",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  uploadExcel.single("excelFile"),
  dashboardController.uploadStudentsExcel
);

router.post(
  "/school/upload-companies-excel",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  uploadExcel.single("excelFile"),
  dashboardController.uploadCompaniesExcel
);

router.post(
  "/school/upload-lead-companies-excel",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  uploadExcel.single("excelFile"),
  dashboardController.uploadLeadCompaniesExcel
);

router.post(
  "/school/upload-liahub-companies-excel",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  uploadExcel.single("excelFile"),
  dashboardController.uploadLiahubCompaniesExcel
);

router.delete(
  "/school/liahub-companies",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.deleteLiahubCompaniesByProgramme
);

router.delete(
  "/school/companies",
  authorize(PERMISSIONS.EDIT_SCHOOL_DASHBOARD),
  dashboardController.deleteCompaniesByType
);

router.get(
  "/school/companies-dropdown",
  authorize(PERMISSIONS.VIEW_SCHOOL_DASHBOARD),
  dashboardController.getCompaniesForDropdown
);

module.exports = router;
