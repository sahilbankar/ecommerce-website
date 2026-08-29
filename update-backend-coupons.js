const fs = require('fs');

const controllerPath = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/backend/controllers/couponController.js';
let ctrlContent = fs.readFileSync(controllerPath, 'utf8');

// Add getActiveCoupons controller
const getActiveCode = `
// @desc    Get all active coupons (Public)
// @route   GET /api/v1/coupons/active
// @access  Public
const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  // Filter out those that exceeded usage limit
  const activeCoupons = coupons.filter(c => c.usageLimit === null || c.usageCount < c.usageLimit);

  res.status(200).json(
    new ApiResponse(200, { count: activeCoupons.length, coupons: activeCoupons }, 'Active coupons retrieved successfully')
  );
});
`;

ctrlContent = ctrlContent.replace(
  "module.exports = {",
  getActiveCode + "\nmodule.exports = {\n  getActiveCoupons,"
);

fs.writeFileSync(controllerPath, ctrlContent);

const routesPath = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/backend/routes/couponRoutes.js';
let routesContent = fs.readFileSync(routesPath, 'utf8');

routesContent = routesContent.replace(
  "validateCoupon,\n  getAllCoupons,",
  "validateCoupon,\n  getAllCoupons,\n  getActiveCoupons,"
);

routesContent = routesContent.replace(
  "router.post('/validate', protect, validateCoupon);",
  "router.post('/validate', protect, validateCoupon);\nrouter.get('/active', getActiveCoupons);"
);

fs.writeFileSync(routesPath, routesContent);
console.log('Backend routes updated');
