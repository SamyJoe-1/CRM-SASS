const multer  = require('multer');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { BusinessError } = require('../utils/AppError');

const ALLOWED_TYPES = ['image/jpeg','image/png','application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new BusinessError('File type not allowed. Allowed: jpg, png, pdf, docx'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
module.exports = upload;
