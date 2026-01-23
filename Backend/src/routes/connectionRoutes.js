const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const connectionController = require("../controllers/connectionController");

const router = express.Router();

router.use(auth);

router.get("/", connectionController.listConnections);
router.post("/", validate(connectionController.validateRequestConnection()), connectionController.requestConnection);
router.post(
  "/:connectionId/respond",
  validate(connectionController.validateRespondConnection()),
  connectionController.respondConnection
);

module.exports = router;
