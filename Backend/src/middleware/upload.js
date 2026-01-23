const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const uploadDir = path.join(__dirname, "../../uploads");
const postsDir = path.join(uploadDir, "posts");

[uploadDir, postsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `post-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedDocs = /pdf|doc|docx/;
  const allowedVideos = /mp4|mov|avi|webm/;
  
  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype.toLowerCase();
  
  const isImage = allowedImages.test(extname) || mimetype.startsWith('image/');
  const isDocument = allowedDocs.test(extname) || mimetype.includes('pdf') || mimetype.includes('document');
  const isVideo = allowedVideos.test(extname) || mimetype.startsWith('video/');
  
  if (isImage || isDocument || isVideo) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: images (jpg, png, gif), PDFs, and videos`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Middleware for single file upload
const uploadSingle = upload.single("file");

// Middleware for multiple files upload (max 5)
const uploadMultiple = upload.array("files", 5);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size too large. Maximum size is 10MB." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Too many files. Maximum is 5 files." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  postsDir
};
