const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Checkout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate, useLocation } from 'react-router-dom';"
);

content = content.replace(
  /const tax = cartTotal \* 0\.08;\s*const shipping = cartTotal > 150 \? 0 : 15\.0;\s*const total = cartTotal \+ tax \+ shipping;/,
  `const location = useLocation();
  const coupon = location.state as { couponCode?: string, discountType?: string, discountAmount?: number } | undefined;

  let discount = 0;
  if (coupon?.couponCode && coupon.discountAmount) {
    if (coupon.discountType === 'percentage') {
      discount = cartTotal * (coupon.discountAmount / 100);
    } else {
      discount = coupon.discountAmount;
    }
  }

  const tax = Math.max(0, (cartTotal - discount) * 0.08);
  const shipping = cartTotal > 150 || cartTotal === 0 ? 0 : 15.0;
  const total = Math.max(0, cartTotal - discount + tax + shipping);`
);

content = content.replace(
  /totalPrice: parseFloat\(total\.toFixed\(2\)\),\s*\};/,
  `totalPrice: parseFloat(total.toFixed(2)),
      couponCode: coupon?.couponCode,
    };`
);

content = content.replace(
  /<span>Items Subtotal<\/span>\s*<span>\{formatCurrency\(cartTotal\)\}<\/span>\s*<\/div>/,
  `<span>Items Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({coupon?.couponCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}`
);

fs.writeFileSync(path, content);
console.log('Checkout.tsx updated');
