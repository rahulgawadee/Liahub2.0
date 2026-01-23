const levels = ["error", "warn", "info", "debug"];

const buildLogger = () => {
  const logger = {};

  levels.forEach((level) => {
    logger[level] = (...args) => {
      const timestamp = new Date().toISOString();
      // eslint-disable-next-line no-console
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        `[${timestamp}] [${level.toUpperCase()}]`,
        ...args
      );
    };
  });

  return logger;
};

module.exports = buildLogger();
