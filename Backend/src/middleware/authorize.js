const { roleHasPermission } = require("../constants/permissions");

const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (permissions.length === 0) {
    return next();
  }

  const hasPermission = permissions.some((permission) =>
    roleHasPermission(req.user.roles, permission)
  );

  if (!hasPermission) {
    return res.status(403).json({ message: "Not enough permissions" });
  }

  return next();
};

module.exports = authorize;
