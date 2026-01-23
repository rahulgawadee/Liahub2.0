const { Server } = require("socket.io");
const logger = require("../utils/logger");
const { verifyAccessToken } = require("../utils/token");

let ioInstance;

const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(",") || ["*"],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!rawToken) {
        logger.warn("Socket connection rejected: missing token");
        return next(new Error("Unauthorized"));
      }
      const payload = verifyAccessToken(rawToken);
      socket.user = { id: payload.sub };
      socket.join(payload.sub);
      return next();
    } catch (error) {
      logger.warn("Socket connection rejected: invalid token");
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", { socketId: socket.id, reason });
    });
  });

  logger.info("Socket.IO initialized");
  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};
