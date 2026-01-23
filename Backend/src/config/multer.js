const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.resolve(__dirname, "..", "..", "uploads");
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
  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

module.exports = upload;
