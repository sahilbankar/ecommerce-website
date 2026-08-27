const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Store files in memory buffer (they go straight to Cloudinary, not disk)
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Multer file filter – validates MIME type
 */
const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(400, `Invalid file type: ${file.mimetype}. Allowed types: JPEG, JPG, PNG, WEBP, GIF`),
      false
    );
  }
  cb(null, true);
};

/**
 * General single-image upload middleware
 * field name: 'image'
 */
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).single('image');

/**
 * Multi-image upload middleware (max 10)
 * field name: 'images'
 */
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).array('images', 10);

/**
 * Multi-field upload: avatar (1) or product images (10)
 */
const uploadFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

/**
 * Wrap multer upload in Express middleware to handle multer errors gracefully
 */
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, `File too large. Maximum size allowed is ${MAX_FILE_SIZE / (1024 * 1024)} MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ApiError(400, 'Too many files. Maximum 10 images allowed'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, `Unexpected field: ${err.field}`));
        }
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle: handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
  uploadFields: handleUpload(uploadFields)
};
