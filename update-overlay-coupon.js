const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexToRemoveCouponSlides = /\{\s*activeCoupons\.map\(\(coupon, i\) => \([\s\S]*?\}\s*\)\s*\)\}/;
content = content.replace(regexToRemoveCouponSlides, "");

const insertCouponBadge = `                  <p className="text-base sm:text-xl text-gray-200 drop-shadow-md">
                    Upgrade your routine with handpicked smart accessories, luxury essentials, and home decor items.
                  </p>
                  
                  {activeCoupons.length > 0 && (
                    <div className="mt-4 mx-auto inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-3 px-6 shadow-2xl pointer-events-auto">
                      <div className="flex flex-col text-left">
                        <span className="text-xs text-white/80 uppercase font-semibold">Limited Time Offer</span>
                        <span className="text-xl font-bold text-white drop-shadow-md">
                          {activeCoupons[0].discountType === 'percentage' ? \`\${activeCoupons[0].discountAmount}% OFF\` : activeCoupons[0].discountType === 'fixed' ? \`₹\${activeCoupons[0].discountAmount} OFF\` : 'FREE SHIPPING'}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-white/30 mx-2" />
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-black tracking-wider text-violet-300 drop-shadow-md">{activeCoupons[0].code}</span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(activeCoupons[0].code); notifySuccess('Code copied to clipboard!'); }}
                          className="p-2 bg-white text-violet-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 shadow-md"
                          title="Copy code"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                      </div>
                    </div>
                  )}
`;

const oldTarget = `<p className="text-base sm:text-xl text-gray-200 drop-shadow-md">\n                    Upgrade your routine with handpicked smart accessories, luxury essentials, and home decor items.\n                  </p>`;

// Replace the target string with the coupon badge block
content = content.replace(oldTarget, insertCouponBadge);

fs.writeFileSync(path, content);
console.log('Moved coupon info onto images');
