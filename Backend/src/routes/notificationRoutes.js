const express = require("express");
const auth = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.use(auth);

router.get("/", notificationController.listNotifications);
router.post("/read", notificationController.markRead);

module.exports = router;
