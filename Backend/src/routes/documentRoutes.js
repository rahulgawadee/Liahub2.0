const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const documentController = require("../controllers/documentController");
const upload = require("../config/multer");

const router = express.Router();

router.use(auth);

router.get("/", documentController.listDocuments);
router.post("/", upload.single("file"), documentController.uploadDocument);
router.delete(
  "/:documentId",
  validate(documentController.validateDeleteDocument()),
  documentController.deleteDocument
);

module.exports = router;
