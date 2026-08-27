const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  deleteOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createOrder)
  .get(admin, getAllOrders);

router.get('/my-orders', getMyOrders);

router
  .route('/:id')
  .get(getOrderById)
  .delete(deleteOrder);

router.put('/:id/pay', updateOrderToPaid);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;
