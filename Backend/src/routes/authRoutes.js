const express = require("express");
const validate = require("../middleware/validate");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/login", validate(authController.validateLogin()), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", auth, authController.logout);
router.post("/students/provision", auth, authController.provisionStudent);
router.post(
	"/register/request-otp",
	validate(authController.validateRequestOtp()),
	authController.requestRegistrationOtp
);
router.post(
	"/register/verify",
	validate(authController.validateVerifyRegistration()),
	authController.verifyRegistration
);

module.exports = router;
