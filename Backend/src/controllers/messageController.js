const { body, param, query } = require("express-validator");
const messageService = require("../services/messageService");

const listThreads = async (req, res, next) => {
  try {
    const threads = await messageService.listThreads({ userId: req.user.id });
    res.json(threads);
  } catch (error) {
    next(error);
  }
};

const validateListMessages = () => [param("threadId").isMongoId(), query("page").optional().isInt({ min: 1 })];

const listMessages = async (req, res, next) => {
  try {
    const messages = await messageService.listMessages({
      threadId: req.params.threadId,
      userId: req.user.id,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 30,
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

const validateSendMessage = () => [body("body").optional().isString()];

const sendMessage = async (req, res, next) => {
  try {
    // Process uploaded files if any
    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        attachments.push({
          filename: file.originalname,
          url: `/uploads/messages/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
        });
      });
    }

    // Handle recipientIds which might be array or string
    let recipientIds = req.body.recipientIds;
    if (typeof recipientIds === "string") {
      try {
        recipientIds = JSON.parse(recipientIds);
      } catch (e) {
        recipientIds = [recipientIds];
      }
    }

    const result = await messageService.sendMessage({
      senderId: req.user.id,
      recipientIds,
      body: req.body.body || (attachments.length > 0 ? "" : undefined),
      attachments,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const validateMarkRead = () => [param("threadId").isMongoId()];

const markRead = async (req, res, next) => {
  try {
    await messageService.markThreadRead({ threadId: req.params.threadId, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listThreads,
  validateListMessages,
  listMessages,
  validateSendMessage,
  sendMessage,
  validateMarkRead,
  markRead,
};
