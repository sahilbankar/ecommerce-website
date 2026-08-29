const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('AdminReviewsPage')) {
  // 1. Add import
  content = content.replace(
    "import AdminProductsPage from './pages/admin/AdminProducts';",
    "import AdminProductsPage from './pages/admin/AdminProducts';\nimport AdminReviewsPage from './pages/admin/AdminReviews';"
  );
  
  // 2. Add Route
  const routeRegex = /<Route path="customers" element=\{<AdminCustomersPage \/>\} \/>/;
  content = content.replace(routeRegex, `<Route path="customers" element={<AdminCustomersPage />} />\n              <Route path="reviews" element={<AdminReviewsPage />} />`);
  
  fs.writeFileSync(path, content);
  console.log('Updated App.tsx');
}
