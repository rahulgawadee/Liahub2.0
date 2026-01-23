const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Unhandled error", err);
  const status = err.status || 500;
  const response = {
    message: err.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);

  if (next) {
    next();
  }
};

module.exports = errorHandler;
