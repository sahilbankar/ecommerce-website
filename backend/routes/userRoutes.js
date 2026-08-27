const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Customer Profile Routes ──────────────────────────
router.use(protect);

router
  .route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.put('/change-password', changePassword);

router
  .route('/addresses')
  .get(getAddresses)
  .post(addAddress);

router
  .route('/addresses/:id')
  .put(updateAddress)
  .delete(deleteAddress);

// ── Admin User Management Routes ─────────────────────
router.get('/', admin, getAllUsers);

router
  .route('/:id')
  .get(admin, getUserById)
  .delete(admin, deleteUser);

router.put('/:id/status', admin, updateUserStatus);

module.exports = router;
