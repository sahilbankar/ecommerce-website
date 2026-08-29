const express = require('express');
const {
  validateCoupon,
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getActiveCoupons
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/validate', protect, validateCoupon);
router.get('/active', getActiveCoupons);

router.use(protect, admin);

router
  .route('/')
  .get(getAllCoupons)
  .post(createCoupon);

router
  .route('/:id')
  .get(getCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon);

module.exports = router;
