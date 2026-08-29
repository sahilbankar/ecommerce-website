const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

const overlayRegex = /\s*\{\/\* Text and Buttons Overlay \*\/\}\s*<div className=\"absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4\">\s*<motion\.div[\s\S]*?<\/motion\.div>\s*<\/div>/;

const textOverlay = `
              {/* Text and Buttons Overlay on EACH image slide */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <div className="space-y-6 max-w-3xl mx-auto pointer-events-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    ✨ New Collection 2026
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                    Modern Living, <br />
                    <span className="text-white">
                      Elevated Design
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl text-gray-200 drop-shadow-md">
                    Upgrade your routine with handpicked smart accessories, luxury essentials, and home decor items.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/shop')}
                      rightIcon={<FiArrowRight />}
                      className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl"
                    >
                      Shop The Sale
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/shop?sort=newest')}
                      className="border-white text-white hover:bg-white/20 backdrop-blur-sm shadow-xl"
                    >
                      Browse New
                    </Button>
                  </div>
                </div>
              </div>`;

content = content.replace(
  "{/* Overlay gradient for better text readability */}",
  "{/* Overlay gradient for better text readability */}\n" + textOverlay
);

content = content.replace(overlayRegex, "");

fs.writeFileSync(path, content);
console.log('Fixed overlay layout');
