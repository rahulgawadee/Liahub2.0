const { param } = require("express-validator");
const documentService = require("../services/documentService");

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
    const document = await documentService.uploadDocument({
      ownerId: req.user.id,
      file: req.file,
      visibility: req.body.visibility,
      description: req.body.description,
    });
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
};

const listDocuments = async (req, res, next) => {
  try {
    const documents = await documentService.listDocuments({ ownerId: req.user.id });
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const validateDeleteDocument = () => [param("documentId").isMongoId()];

const deleteDocument = async (req, res, next) => {
  try {
    await documentService.deleteDocument({ documentId: req.params.documentId, ownerId: req.user.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  validateDeleteDocument,
  deleteDocument,
};
