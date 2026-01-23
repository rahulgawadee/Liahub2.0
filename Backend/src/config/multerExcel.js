const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/excel');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to only accept Excel files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
  }
};

// Configure multer
const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = uploadExcel;
