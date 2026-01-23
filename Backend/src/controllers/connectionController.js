const { body, param } = require("express-validator");
const connectionService = require("../services/connectionService");

const validateRequestConnection = () => [body("recipientId").isMongoId(), body("message").optional().isString()];

const requestConnection = async (req, res, next) => {
  try {
    const connection = await connectionService.requestConnection({
      requesterId: req.user.id,
      recipientId: req.body.recipientId,
      message: req.body.message,
      attachments: req.body.attachments,
    });
    res.status(201).json(connection);
  } catch (error) {
    next(error);
  }
};

const validateRespondConnection = () => [param("connectionId").isMongoId(), body("action").isIn(["accept", "reject", "withdraw"])];

const respondConnection = async (req, res, next) => {
  try {
    const connection = await connectionService.respondConnection({
      connectionId: req.params.connectionId,
      recipientId: req.user.id,
      action: req.body.action,
    });
    res.json(connection);
  } catch (error) {
    next(error);
  }
};

const listConnections = async (req, res, next) => {
  try {
    const summary = await connectionService.listNetwork({ userId: req.user.id });
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateRequestConnection,
  requestConnection,
  validateRespondConnection,
  respondConnection,
  listConnections,
};
