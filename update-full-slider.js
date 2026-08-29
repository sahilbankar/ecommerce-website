const fs = require('fs');
const path = 'd:/ecommerce-web-site(1)/ecommerce-web-site(1)/ecommerce-web-site/frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSectionRegex = /<section className=\"relative overflow-hidden bg-gradient-to-br from-primary-600[\s\S]*?<\/section>/;

const newSection = `<section className="relative overflow-hidden w-full h-[70vh] min-h-[500px] lg:h-[750px] text-white">
        {/* Full-width Slider Container */}
        <div 
          ref={scrollRef}
          className="absolute inset-0 flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {heroImages.map((src, i) => (
            <div key={i} className="flex-none w-full h-full snap-center relative">
              <img
                src={src}
                alt={\`Slide \${i+1}\`}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
            </div>
          ))}
        </div>

        {/* Text and Buttons Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
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
          </motion.div>
        </div>

        <style>
          {\`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
          \`}
        </style>
      </section>`;

content = content.replace(oldSectionRegex, newSection);

fs.writeFileSync(path, content);
console.log('Replaced Hero Section with Full-Width Slider');
