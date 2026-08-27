const express = require('express');
const {
  uploadAvatar,
  uploadProductImages,
  deleteProductImage,
  uploadCategoryImage,
  uploadBrandLogo,
  deleteImage
} = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMultiple } = require('../middleware/multerMiddleware');

const router = express.Router();

// ── Avatar ───────────────────────────────────────────
// PUT /api/v1/upload/avatar
router.put('/avatar', protect, uploadSingle, uploadAvatar);

// ── Product Images ───────────────────────────────────
// POST   /api/v1/upload/product/:productId/images  – upload (up to 10)
// DELETE /api/v1/upload/product/:productId/images  – delete one by public_id
router
  .route('/product/:productId/images')
  .post(protect, admin, uploadMultiple, uploadProductImages)
  .delete(protect, admin, deleteProductImage);

// ── Category Image ───────────────────────────────────
// PUT /api/v1/upload/category/:categoryId/image
router.put('/category/:categoryId/image', protect, admin, uploadSingle, uploadCategoryImage);

// ── Brand Logo ───────────────────────────────────────
// PUT /api/v1/upload/brand/:brandId/logo
router.put('/brand/:brandId/logo', protect, admin, uploadSingle, uploadBrandLogo);

// ── Generic Delete ───────────────────────────────────
// DELETE /api/v1/upload/image
router.delete('/image', protect, admin, deleteImage);

module.exports = router;
