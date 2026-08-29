const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Cart.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add api import
content = content.replace(
  "import { notifySuccess, notifyError } from '../components/Toast';",
  "import { notifySuccess, notifyError } from '../components/Toast';\nimport { api } from '../services/api';"
);

// We need to keep track of the absolute discount amount instead of percent if the backend supports fixed amounts.
// Backend response: { coupon: { code, discountType, discountAmount, calculatedDiscount } }
// Let's replace the `discountPercent` state with `appliedCoupon` object state.

content = content.replace(
  "const [discountPercent, setDiscountPercent] = useState(0);",
  "const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountType: string, discountAmount: number, calculatedDiscount: number} | null>(null);"
);

content = content.replace(
  /const handleApplyCoupon = \(e: React\.FormEvent\) => \{[\s\S]*?\};\n/,
  `const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        purchaseAmount: totalAmount
      });
      setAppliedCoupon(res.data?.data?.coupon);
      notifySuccess(\`Coupon code \${res.data?.data?.coupon.code} applied successfully!\`);
    } catch (err: any) {
      setAppliedCoupon(null);
      notifyError(err.response?.data?.message || 'Invalid coupon code.');
    }
  };
`
);

// Calculations
content = content.replace(
  "const discountAmount = subtotal * (discountPercent / 100);",
  "const discountAmount = appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? subtotal * (appliedCoupon.discountAmount / 100) : appliedCoupon.discountAmount) : 0;"
);

// Update UI displaying discount
content = content.replace(
  /\{discountPercent > 0 && \([\s\S]*?Discount \(\{discountPercent\}%\)[\s\S]*?\)\}/,
  `{appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({appliedCoupon.discountType === 'percentage' ? \`\${appliedCoupon.discountAmount}%\` : \`₹\${appliedCoupon.discountAmount}\`})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}`
);

fs.writeFileSync(path, content);
console.log('Cart.tsx updated');
