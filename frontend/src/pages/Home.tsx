import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import Button from '../components/Button';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { notifySuccess } from '../components/Toast';
import { productService, categoryService, couponService } from '../services';
import { peacockWallArtRoom } from '../assets';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef<number>(1);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    if (isHovered) return;
    
    const step = 1;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (directionRef.current === 1 && scrollLeft + clientWidth >= scrollWidth - 1) {
          directionRef.current = -1;
        } else if (directionRef.current === -1 && scrollLeft <= 0) {
          directionRef.current = 1;
        }
        scrollRef.current.scrollBy({ left: step * directionRef.current });
      }
    }, 20);
    return () => clearInterval(interval);
  }, [isHovered]);

  const heroImages = [
    // Authentic Shree Home Decor Peacock Wall Art in Luxury Living Room
    peacockWallArtRoom,
    // Elegant living room with sofa and home decor
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80",
    // Beautiful curtains / window drapes
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop&q=80",
    // Luxury bedsheet / bedroom setup
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&auto=format&fit=crop&q=80",
    // Decorative cushion covers on sofa
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1600&auto=format&fit=crop&q=80",
    // Cozy home interior with soft furnishings
    "https://images.unsplash.com/photo-1618219944342-824e40a13285?w=1600&auto=format&fit=crop&q=80",
    // Sofa cover / couch with throw blanket
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=80",
    // Bedroom with premium bedsheet and pillows
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&auto=format&fit=crop&q=80",
    // Modern home decor accessories
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80",
    // Elegant dining / home furnishing
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&auto=format&fit=crop&q=80"
  ];

  // Fetch real data from backend API
  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      setIsCategoriesLoading(true);

      // 1. Fetch categories
      categoryService.getCategories()
        .then((cats) => {
          const sorted = [...cats].sort((a, b) => {
            if (a.image && !b.image) return -1;
            if (!a.image && b.image) return 1;
            return 0;
          });
          setCategories(sorted.slice(0, 8));
        })
        .catch(() => setCategories([]))
        .finally(() => setIsCategoriesLoading(false));

      // 2. Fetch featured products, newest products, and active coupons concurrently
      try {
        const [featured, newest, coupons] = await Promise.all([
          productService.getFeaturedProducts(12).catch(() => []),
          productService.getNewArrivals(12).catch(() => []),
          couponService.getActiveCoupons().catch(() => [])
        ]);

        setFeaturedProducts(featured.length > 0 ? featured : newest.slice(0, 8));
        setNewProducts(newest);
        setActiveCoupons(coupons);
      } catch {
        setFeaturedProducts([]);
        setNewProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const ProductSkeleton = () => (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800 aspect-[4/3] w-full" />
  );

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden w-full h-[60vh] min-h-[450px] lg:h-[650px] text-white"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
                alt={`Slide ${i+1}`}
                className="w-full h-full object-cover"
              />

              {/* Text and Buttons Overlay on EACH image slide */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <div className="space-y-6 max-w-3xl mx-auto pointer-events-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    🏠 New Collection 2026
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                    Beautiful Homes, <br />
                    <span className="text-white">
                      Crafted With Love
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl text-gray-200 drop-shadow-md">
                    Transform your home with premium curtains, bedsheets, sofa covers, cushion covers & more — only at Shree Home Decor.
                  </p>
                  
                  {activeCoupons.length > 0 && (
                    <div className="mt-4 mx-auto inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl p-3 px-6 shadow-2xl pointer-events-auto">
                      <div className="flex flex-col text-left">
                        <span className="text-xs text-white/80 uppercase font-semibold">Limited Time Offer</span>
                        <span className="text-xl font-bold text-white drop-shadow-md">
                          {activeCoupons[0].discountType === 'percentage' ? `${activeCoupons[0].discountAmount}% OFF` : activeCoupons[0].discountType === 'fixed' ? `₹${activeCoupons[0].discountAmount} OFF` : 'FREE SHIPPING'}
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
              </div>
              <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
            </div>
          ))}
        </div>

        <style>
          {`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
          `}
        </style>
      </section>

      {/* Feature Badges Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
              <FiTruck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Free Shipping</h4>
              <p className="text-xs text-gray-500">On all orders above ₹499</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
              <FiRefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">30-Day Returns</h4>
              <p className="text-xs text-gray-500">Hassle-free moneyback policy</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
              <FiShield className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Secure Payments</h4>
              <p className="text-xs text-gray-500">100% SSL protected checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-xl">
              <FiHeadphones className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">24/7 Live Support</h4>
              <p className="text-xs text-gray-500">Dedicated ticket desk support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Shop by Category</h2>
            <p className="text-sm text-gray-500">Browse collection directories</p>
          </div>
          <Link to="/categories" className="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">
            View All Categories &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isCategoriesLoading
            ? Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id || category._id} category={category} />
              ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Trending Items</h2>
          <p className="text-sm text-gray-500">Customer favorite collections</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : featuredProducts.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onAddToCart={(p) => {
                    dispatch(addToCartAsync({ product: p }));
                    notifySuccess(`Added ${p.title} to Cart!`);
                  }}
                />
              ))}
        </div>
      </section>

      {/* New Arrivals Banner Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">New Arrivals</h2>
          <p className="text-sm text-gray-500">Fresh items in stock today</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : newProducts.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onAddToCart={(p) => {
                    dispatch(addToCartAsync({ product: p }));
                    notifySuccess(`Added ${p.title} to Cart!`);
                  }}
                />
              ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
