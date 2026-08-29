const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Cart.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "onClick={() => navigate('/checkout')}",
  "onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code, discountType: appliedCoupon?.discountType, discountAmount: appliedCoupon?.discountAmount } })}"
);

fs.writeFileSync(path, content);
console.log('Cart navigate updated');
