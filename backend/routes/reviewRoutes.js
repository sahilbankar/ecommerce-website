const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getProductReviews);
router.get('/all', protect, admin, getAllReviews);

router.post('/', protect, createReview);

router
  .route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

router.put('/:id/status', protect, admin, updateReviewStatus);

module.exports = router;
