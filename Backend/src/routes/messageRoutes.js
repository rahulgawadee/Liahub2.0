const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const messageController = require("../controllers/messageController");
const uploadMessageDocs = require("../config/multerMessageDocs");

const router = express.Router();

router.use(auth);

router.get("/threads", messageController.listThreads);
router.get(
  "/threads/:threadId/messages",
  validate(messageController.validateListMessages()),
  messageController.listMessages
);
router.post(
  "/send",
  uploadMessageDocs.array("files", 5),
  validate(messageController.validateSendMessage()),
  messageController.sendMessage
);
router.post(
  "/threads/:threadId/read",
  validate(messageController.validateMarkRead()),
  messageController.markRead
);

module.exports = router;
