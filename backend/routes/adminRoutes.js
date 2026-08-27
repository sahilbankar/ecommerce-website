const express = require('express');
const { getDashboardStats, getRecentOrders } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);

module.exports = router;
