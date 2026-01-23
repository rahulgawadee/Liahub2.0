const express = require("express");
const organizationController = require("../controllers/organizationController");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all companies (for schools to select when creating jobs)
router.get("/companies", auth, organizationController.listCompanies);

// Get organizations by type
router.get("/", auth, organizationController.listOrganizations);

// Get organization by id
router.get('/:id', auth, organizationController.getOrganization);

module.exports = router;
