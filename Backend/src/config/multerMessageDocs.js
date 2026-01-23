const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Create uploads/messages directory for message attachments
const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "messages");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-");
    cb(null, `${timestamp}-${randomString}-${basename}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  // Allow various document types, images, and compressed files
  const allowedMimeTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Compressed files
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    // Other common types
    "application/json",
    "application/xml",
    "text/xml",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload documents, images, or compressed files.`));
  }
};

// Allow up to 5 files per message, max 50MB each
const uploadMessageDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 5, // Maximum 5 files per message
  },
});

module.exports = uploadMessageDocs;
