import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { MOCK_CATEGORIES } from '../constants/dummyData';
import { BackendProduct, Product } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import Button from '../components/Button';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';

// Map backend product to frontend Product type
const mapBackendProduct = (p: BackendProduct): Product => {
  const catObj = typeof p.category === 'object' && p.category !== null ? p.category : null;
  const ratingsAvg =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.average : (p.ratings as number) || 0;
  const numReviews =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.numReviews : p.numReviews || 0;

  return {
    _id: p._id,
    id: p._id || p.id || '',
    title: p.title,
    slug: p.slug || '',
    description: p.description,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    category: catObj
      ? { id: catObj._id || catObj.id || '', name: catObj.name, slug: catObj.slug || '' }
      : String(p.category),
    brand:
      p.brand && typeof p.brand === 'object'
        ? p.brand.name
        : String(p.brand || ''),
    // images can be [{url, public_id}] from backend — ProductCard handles both
    images: (p.images || []) as unknown as string[],
    ratings: ratingsAvg,
    numReviews,
    isFeatured: p.isFeatured,
  };
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      setIsLoading(true);
      try {
        const [featuredRes, newestRes] = await Promise.all([
          api.get('/products', { params: { isFeatured: 'true', limit: 4 } }),
          api.get('/products', { params: { sort: 'newest', limit: 4 } }),
        ]);

        const featuredRaw: BackendProduct[] = featuredRes.data?.data?.products || [];
        const newestRaw: BackendProduct[] = newestRes.data?.data?.products || [];

        setFeaturedProducts(featuredRaw.map(mapBackendProduct));
        setNewProducts(newestRaw.map(mapBackendProduct));
      } catch {
        notifyError('Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeProducts();
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

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white py-20 lg:py-32 dark:from-primary-950 dark:via-indigo-950 dark:to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              ✨ New Collection 2026
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
              Modern Living, <br />
              <span className="bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
                Elevated Design
              </span>
            </h1>
            <p className="text-base sm:text-lg text-primary-100 max-w-xl mx-auto lg:mx-0">
              Upgrade your routine with handpicked smart accessories, luxury essentials, and home decor items.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/shop')}
                rightIcon={<FiArrowRight />}
                className="bg-white text-primary-700 hover:bg-primary-50 focus:ring-white dark:bg-white dark:text-primary-900"
              >
                Shop The Sale
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/shop?sort=newest')}
                className="border-white text-white hover:bg-white/10"
              >
                Browse New
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
              alt="Feature headphones"
              className="relative w-full max-w-md object-contain rounded-3xl shadow-2xl hover:scale-102 transition-transform duration-300"
            />
          </motion.div>
        </div>
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
          {MOCK_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
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
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
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
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : newProducts.map((product) => (
                <ProductCard
                  key={product.id}
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
