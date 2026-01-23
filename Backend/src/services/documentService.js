const path = require("path");
const fs = require("fs/promises");
const Document = require("../models/Document");

const uploadDocument = async ({ ownerId, file, visibility = "private", description }) => {
  const storagePath = file.path.replace(/\\/g, "/");
  const document = await Document.create({
    owner: ownerId,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    storagePath,
    visibility,
    description,
  });
  return document;
};

const listDocuments = async ({ ownerId }) => {
  const documents = await Document.find({ owner: ownerId }).sort({ createdAt: -1 });
  return documents;
};

const deleteDocument = async ({ documentId, ownerId }) => {
  const document = await Document.findOne({ _id: documentId, owner: ownerId });
  if (!document) {
    throw Object.assign(new Error("Document not found"), { status: 404 });
  }

  await Document.deleteOne({ _id: documentId });
  try {
    await fs.unlink(path.resolve(document.storagePath));
  } catch (error) {
    // ignore if file already removed
  }
  return document;
};

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
};
