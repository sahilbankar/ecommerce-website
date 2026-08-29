const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add useRef to imports
content = content.replace(
  "import React, { useState, useEffect } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

// Add slider logic to Home component
const sliderLogic = `
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let scrollAmount = 0;
    let scrollDirection = 1; // 1 for right, -1 for left
    const step = 1;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollDirection === 1 && scrollLeft + clientWidth >= scrollWidth - 1) {
          scrollDirection = -1;
        } else if (scrollDirection === -1 && scrollLeft <= 0) {
          scrollDirection = 1;
        }
        scrollRef.current.scrollBy({ left: step * scrollDirection });
      }
    }, 20); // Smooth continuous scroll
    return () => clearInterval(interval);
  }, []);

  const heroImages = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80"
  ];
`;

content = content.replace(
  "const [isLoading, setIsLoading] = useState(true);",
  "const [isLoading, setIsLoading] = useState(true);\n" + sliderLogic
);

// Remove buttons from left section
content = content.replace(
  /<div className=\"flex flex-wrap items-center justify-center lg:justify-start gap-4\">\s*<Button[\s\S]*?Shop The Sale\s*<\/Button>\s*<Button[\s\S]*?Browse New\s*<\/Button>\s*<\/div>/,
  ""
);

// Replace right section image with slider and overlaid buttons
const newRightSection = `<motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative flex items-center justify-center w-full max-w-md mx-auto overflow-hidden rounded-3xl shadow-2xl group"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl z-0" />
            
            <div 
              ref={scrollRef}
              className="relative z-10 flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {heroImages.map((src, i) => (
                <div key={i} className="flex-none w-full h-[400px] snap-center relative">
                  <img
                    src={src}
                    alt={\`Slide \${i+1}\`}
                    className="w-full h-full object-cover"
                  />
                  {/* Buttons overlaid on EACH image as requested */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => navigate('/shop')}
                      rightIcon={<FiArrowRight />}
                      className="bg-white text-primary-700 hover:bg-primary-50 focus:ring-white dark:bg-white dark:text-primary-900 shadow-lg"
                    >
                      Shop The Sale
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/shop?sort=newest')}
                      className="border-white text-white hover:bg-white/10 backdrop-blur-sm shadow-lg"
                    >
                      Browse New
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <style>
              {\`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
              \`}
            </style>
          </motion.div>`;

content = content.replace(
  /<motion\.div\s*initial=\{\{ opacity: 0, scale: 0\.9 \}\}\s*animate=\{\{ opacity: 1, scale: 1 \}\}\s*transition=\{\{ duration: 0\.6, delay: 0\.1 \}\}\s*className=\"relative flex items-center justify-center\"\s*>[\s\S]*?<\/motion\.div>/,
  newRightSection
);

fs.writeFileSync(path, content);
console.log('Slider added to Home.tsx');
