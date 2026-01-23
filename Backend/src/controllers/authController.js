const { body } = require("express-validator");
const authService = require("../services/authService");

const validateLogin = () => [
  body("entity").isIn(["student", "school", "university", "company"]),
  body("identifier").notEmpty(),
  body("password").notEmpty(),
  body("subRole")
    .if(body("entity").not().equals("student"))
    .notEmpty()
    .withMessage("Role selection is required for this workspace"),
];

const validateRequestOtp = () => [
  body("entity").isIn(["student", "school", "university", "company"]),
  body("form").isObject(),
  body("form.email").isEmail(),
  body("form.username").notEmpty(),
  body("form.password").isLength({ min: 6 }),
  body("form.fullName").notEmpty(),
];

const validateVerifyRegistration = () => [
  body("entity").isIn(["student", "school", "university", "company"]),
  body("otp").isLength({ min: 4 }),
  body("form").isObject(),
  body("form.email").isEmail(),
  body("form.username").notEmpty(),
];

const login = async (req, res, next) => {
  try {
    const { identifier, password, entity, subRole } = req.body;
    
    if (!identifier || !password || !entity) {
      return res.status(400).json({
        message: "Missing required fields",
        code: "VALIDATION_ERROR"
      });
    }

    const result = await authService.login({ identifier, password, entity, subRole, req });
    
    res.status(200).json(result);
  } catch (error) {
    const status = error.status || 400;
    const message = error.message || "Login failed";
    const code = error.code || "LOGIN_ERROR";
    
    res.status(status).json({ message, code });
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token is required",
        code: "REFRESH_TOKEN_MISSING"
      });
    }

    const result = await authService.refresh(refreshToken, req);
    
    res.status(200).json(result);
  } catch (error) {
    const status = error.status || 401;
    const message = error.message || "Token refresh failed";
    const code = error.code || "REFRESH_ERROR";
    
    res.status(status).json({ 
      message, 
      code,
      shouldRefresh: status === 401
    });
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.session) {
      await authService.logout(req.session.id);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const provisionStudent = async (req, res, next) => {
  try {
    const payload = await authService.provisionStudent({
      organizationId: req.user.organization,
      payload: req.body,
      invitedBy: req.user.id,
    });
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

const requestRegistrationOtp = async (req, res, next) => {
  try {
    const payload = await authService.requestRegistrationOtp({ entity: req.body.entity, form: req.body.form });
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

const verifyRegistration = async (req, res, next) => {
  try {
    const payload = await authService.verifyRegistration({
      entity: req.body.entity,
      otp: req.body.otp,
      form: req.body.form,
      req,
    });
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateLogin,
  validateRequestOtp,
  validateVerifyRegistration,
  login,
  refresh,
  logout,
  provisionStudent,
  requestRegistrationOtp,
  verifyRegistration,
};
