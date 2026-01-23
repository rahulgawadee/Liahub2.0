const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported image type. Only JPEG, PNG, GIF, and WebP are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
});

module.exports = upload;