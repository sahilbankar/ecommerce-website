const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getWishlist)
  .post(addToWishlist)
  .delete(clearWishlist);

router
  .route('/:productId')
  .delete(removeFromWishlist);

module.exports = router;
