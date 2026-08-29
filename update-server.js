const fs = require('fs');
const appPath = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/backend/server.js';
let appModel = fs.readFileSync(appPath, 'utf8');

if (!appModel.includes('reviewRoutes')) {
  appModel = appModel.replace(
    /const couponRoutes = require\('\.\/routes\/couponRoutes'\);/,
    "const couponRoutes = require('./routes/couponRoutes');\nconst reviewRoutes = require('./routes/reviewRoutes');"
  );
  appModel = appModel.replace(
    /app\.use\('\/api\/v1\/coupons', couponRoutes\);/,
    "app.use('/api/v1/coupons', couponRoutes);\napp.use('/api/v1/reviews', reviewRoutes);"
  );
  fs.writeFileSync(appPath, appModel);
  console.log('Updated server.js');
}
