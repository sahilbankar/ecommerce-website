const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add state for activeCoupons
content = content.replace(
  "const [newProducts, setNewProducts] = useState<Product[]>([]);",
  "const [newProducts, setNewProducts] = useState<Product[]>([]);\n  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);"
);

// Update fetch logic
const oldFetch = `        const [featuredRes, newestRes] = await Promise.all([
          api.get('/products', { params: { isFeatured: 'true', limit: 12 } }),
          api.get('/products', { params: { sort: 'newest', limit: 12 } }),
        ]);`;

const newFetch = `        const [featuredRes, newestRes, couponsRes] = await Promise.all([
          api.get('/products', { params: { isFeatured: 'true', limit: 12 } }),
          api.get('/products', { params: { sort: 'newest', limit: 12 } }),
          api.get('/coupons/active').catch(() => ({ data: { data: { coupons: [] } } }))
        ]);
        setActiveCoupons(couponsRes.data?.data?.coupons || []);`;

content = content.replace(oldFetch, newFetch);

// Add coupon slides inside the slider container
const couponSlides = `          {activeCoupons.map((coupon, i) => (
            <div key={\`coupon-\${i}\`} className="flex-none w-full h-full snap-center relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500" />
              {/* Overlay pattern */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)] bg-[length:20px_20px]" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-2 drop-shadow-md">Special Offer!</h2>
                <p className="text-2xl sm:text-3xl text-white/90 mb-8 font-medium">
                  {coupon.discountType === 'percentage' ? \`Get \${coupon.discountAmount}% OFF\` : coupon.discountType === 'fixed' ? \`Get ₹\${coupon.discountAmount} OFF\` : 'Get FREE SHIPPING'}
                </p>
                <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-3xl p-6 flex flex-col items-center shadow-2xl hover:bg-white/20 transition-colors">
                  <span className="text-sm text-white/80 uppercase tracking-widest mb-2 font-semibold">Use Code at Checkout</span>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-mono font-black text-white tracking-wider">{coupon.code}</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(coupon.code); notifySuccess('Code copied to clipboard!'); }}
                      className="p-3 bg-white text-violet-600 hover:bg-gray-100 rounded-xl transition-colors shadow-lg active:scale-95"
                      title="Copy code"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                  </div>
                  {coupon.minPurchase > 0 && <span className="text-xs text-white/70 mt-3">Min. order ₹{coupon.minPurchase}</span>}
                </div>
              </div>
            </div>
          ))}

          {heroImages.map((src, i) => (`;

content = content.replace("{heroImages.map((src, i) => (", couponSlides);

fs.writeFileSync(path, content);
console.log('Home.tsx updated with coupon slides');
