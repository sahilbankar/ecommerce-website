import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiStar, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { BackendProduct, Product, ProductSpec } from '../types';
import { formatCurrency } from '../utils';
import RatingComponent from '../components/RatingComponent';
import Button from '../components/Button';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../redux/slices/wishlistSlice';
import { notifySuccess, notifyError } from '../components/Toast';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';
import Skeleton from '../components/SkeletonLoader';


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
    images: (p.images || []) as unknown as string[],
    ratings: ratingsAvg,
    numReviews,
    isFeatured: p.isFeatured,
  };
};

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const wishlistItems = useSelector((state: RootState) => state.wishlist?.items || []);
  const currentUser = useSelector((state: RootState) => state.auth?.user);

  const [product, setProduct] = useState<BackendProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isInWishlist = product
    ? wishlistItems.some((item) => (item._id || item.id) === (product._id || product.id))
    : false;

  // Resolved image URLs from backend [{url, public_id, variant}] or string[]
  const [imageUrls, setImageUrls] = useState<{ url: string; variant: string }[]>([]);
  const [activeImage, setActiveImage] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  // Derived: active variant info (price/stock) for selected size
  const activeVariant = product?.variants?.find(
    (v) => v.size === selectedSize || v.name === selectedSize
  ) ?? null;
  const displayPrice = activeVariant?.price ?? product?.price ?? 0;
  const displayDiscountPrice = activeVariant?.discountPrice ?? product?.discountPrice;
  const displayStock = activeVariant?.stock ?? product?.stock ?? 0;

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        // Try by ID first, then by slug
        let res;
        try {
          res = await api.get(`/products/${id}`);
        } catch {
          res = await api.get(`/products/slug/${id}`);
        }

        const prod: BackendProduct = res.data?.data?.product;
        if (!prod) throw new Error('Product not found');

        setProduct(prod);
        
        try {
          const revRes = await api.get(`/reviews?productId=${prod._id}`);
          setReviews(revRes.data?.data?.reviews || []);
        } catch (e) {
          console.error('Failed to load reviews', e);
        }

        // Resolve image URLs with variant tags
        const urls: { url: string; variant: string }[] = (prod.images || []).map((img: unknown) => {
          if (typeof img === 'string') return { url: img, variant: '' };
          if (img && typeof img === 'object' && 'url' in img) {
            const imgObj = img as { url: string; variant?: string };
            return { url: imgObj.url, variant: imgObj.variant || '' };
          }
          return { url: '', variant: '' };
        }).filter((i) => i.url);
        setImageUrls(urls);
        setActiveImage(urls[0]?.url || '');

        // Initialize size selection to first available size
        if (prod.sizes && prod.sizes.length > 0) {
          setSelectedSize(prod.sizes[0]);
          // Switch to variant image only if one is explicitly assigned
          const variantImg = urls.find((u) => u.variant === prod.sizes![0]);
          if (variantImg && variantImg.url) setActiveImage(variantImg.url);
        }

        // Fetch related products by category
        if (prod.category) {
          const catId =
            typeof prod.category === 'object' && prod.category !== null
              ? prod.category._id || prod.category.id
              : prod.category;
          if (catId) {
            const relRes = await api.get('/products', {
              params: { category: catId, limit: 4 },
            });
            const rawRelated: BackendProduct[] = relRes.data?.data?.products || [];
            setRelatedProducts(
              rawRelated
                .filter((p) => (p._id || p.id) !== (prod._id || prod.id))
                .slice(0, 4)
                .map(mapBackendProduct)
            );
          }
        }
      } catch {
        notifyError('Failed to load product. Redirecting to shop.');
        navigate('/shop');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(
      addToCartAsync({
        product,
        quantity,
        color: selectedColor,
        size: selectedSize,
      })
    );
    const sizeLabel = selectedSize ? ` (${selectedSize})` : '';
    notifySuccess(`Added ${quantity}x ${product.title}${sizeLabel} to Cart!`);
  };

  const handleAddToWishlist = async () => {
    if (!product) return;
    const mapped = mapBackendProduct(product);
    try {
      const result = await dispatch(toggleWishlistAsync(mapped)).unwrap();
      if (result.added) {
        notifySuccess(`Added ${product.title} to your Wishlist!`);
      } else {
        notifySuccess(`Removed ${product.title} from your Wishlist!`);
      }
    } catch (err: any) {
      notifyError(err || 'Failed to update wishlist');
    }
  };

  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!newReviewComment.trim()) {
      notifyError('Please enter a review comment.');
      return;
    }
    const prodId = product._id || product.id;
    setIsSubmittingReview(true);
    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, {
          rating: newReviewRating,
          comment: newReviewComment.trim(),
        });
        notifySuccess('Review updated successfully!');
      } else {
        await api.post('/reviews', {
          productId: prodId,
          rating: newReviewRating,
          comment: newReviewComment.trim(),
        });
        notifySuccess('Review submitted successfully!');
      }
      setNewReviewComment('');
      setNewReviewRating(5);
      setEditingReviewId(null);

      // Refresh product details & reviews
      const [prodRes, revRes] = await Promise.all([
        api.get(`/products/${prodId}`),
        api.get(`/reviews?productId=${prodId}`),
      ]);
      if (prodRes.data?.data?.product) {
        setProduct(prodRes.data.data.product);
      }
      setReviews(revRes.data?.data?.reviews || []);
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to save review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      notifySuccess('Review deleted successfully!');
      const prodId = product?._id || product?.id;
      if (prodId) {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${prodId}`),
          api.get(`/reviews?productId=${prodId}`),
        ]);
        if (prodRes.data?.data?.product) setProduct(prodRes.data.data.product);
        setReviews(revRes.data?.data?.reviews || []);
      }
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3 rounded" />
            <Skeleton className="h-10 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const categoryName =
    typeof product.category === 'object' && product.category !== null
      ? product.category.name
      : String(product.category);
  const brandName =
    product.brand && typeof product.brand === 'object'
      ? product.brand.name
      : String(product.brand || '');
  const isOutOfStock = displayStock <= 0;
  const ratingsAvg =
    product.ratings && typeof product.ratings === 'object'
      ? product.ratings.average
      : (product.ratings as number) || 0;
  const numReviews =
    product.ratings && typeof product.ratings === 'object'
      ? product.ratings.numReviews
      : product.numReviews || 0;

  const specs: ProductSpec[] = product.specs || [];

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      <Breadcrumb
        items={[
          { label: 'Shop', href: '/shop' },
          { label: product.title },
        ]}
      />

      {/* Main Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Images View */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <img
              src={activeImage || fallbackImage}
              alt={product.title}
              className="h-full w-full object-cover object-center transition-transform hover:scale-105"
            />
          </div>

          {/* Thumbnails — show all images when there are any */}
          {imageUrls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2">
              {imageUrls.map((imgObj, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgObj.url)}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                    activeImage === imgObj.url
                      ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-700'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <img src={imgObj.url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                  {imgObj.variant && (
                    <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-bold bg-black/60 text-white py-0.5 truncate">
                      {imgObj.variant}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Descriptions & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {brandName || 'Premium Collection'}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              {product.title}
            </h1>

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-2">
              <RatingComponent value={ratingsAvg} size="sm" showNumber />
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {numReviews} Verified Reviews
              </span>
            </div>

            {/* Price section */}
            <div className="mt-4 flex items-baseline gap-3">
              {displayDiscountPrice ? (
                <>
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {formatCurrency(displayDiscountPrice)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(displayPrice)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {formatCurrency(displayPrice)}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 border-y border-gray-100 dark:border-gray-800 py-6">
            {/* Color Select — show only if product has colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Color</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                        selectedColor === color
                          ? 'border-primary-600 bg-primary-50/20 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Select — show real sizes from product */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        // Auto-switch main image to the one assigned to this size
                        const variantImg = imageUrls.find((u) => u.variant === size);
                        if (variantImg) setActiveImage(variantImg.url);
                      }}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                        selectedSize === size
                          ? 'border-primary-600 bg-primary-50/20 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quantity</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <FiPlus />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {displayStock > 0 ? `${displayStock} units available` : 'Out of stock'}
                </span>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              className="flex-1 min-w-[200px]"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              leftIcon={<FiShoppingCart className="h-5 w-5" />}
            >
              Add To Cart
            </Button>
            <Button
              variant="outline"
              onClick={handleAddToWishlist}
              leftIcon={
                isInWishlist ? (
                  <FaHeart className="h-5 w-5 text-red-500" />
                ) : (
                  <FiHeart className="h-5 w-5" />
                )
              }
              className={isInWishlist ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 text-red-600 dark:text-red-400' : ''}
            >
              {isInWishlist ? 'In Wishlist' : 'Wishlist'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description vs Reviews */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-8 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 text-sm font-bold tracking-tight transition-all border-b-2 ${
              activeTab === 'details'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Product Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold tracking-tight transition-all border-b-2 ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Reviews ({numReviews})
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Specifications</h3>
            <table className="w-full text-sm divide-y divide-gray-100 dark:divide-gray-850">
              <tbody>
                <tr className="py-2.5 flex justify-between border-b border-gray-50 dark:border-gray-800/40">
                  <td className="font-semibold text-gray-400">Brand</td>
                  <td className="text-gray-800 dark:text-gray-200">{brandName || 'N/A'}</td>
                </tr>
                <tr className="py-2.5 flex justify-between border-b border-gray-50 dark:border-gray-800/40">
                  <td className="font-semibold text-gray-400">Category</td>
                  <td className="text-gray-800 dark:text-gray-200">{categoryName}</td>
                </tr>
                {specs.map((spec, i) => (
                  <tr key={i} className="py-2.5 flex justify-between border-b border-gray-50 dark:border-gray-800/40">
                    <td className="font-semibold text-gray-400">{spec.key}</td>
                    <td className="text-gray-800 dark:text-gray-200">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-8 max-w-3xl">
            {/* Write a Review Form */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingReviewId ? 'Edit Your Review' : 'Write a Customer Review'}
                </h4>
                {editingReviewId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReviewId(null);
                      setNewReviewComment('');
                      setNewReviewRating(5);
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <FiStar
                          className={`h-6 w-6 ${
                            star <= newReviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                      {newReviewRating} / 5
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Your Review / Comment
                  </label>
                  <textarea
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Write your experience with this product..."
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmittingReview || !newReviewComment.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isSubmittingReview ? (editingReviewId ? 'Updating...' : 'Submitting...') : (editingReviewId ? 'Update Review' : 'Submit Review')}
                  </Button>
                  {editingReviewId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingReviewId(null);
                        setNewReviewComment('');
                        setNewReviewRating(5);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* List of Reviews */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No reviews yet. Be the first to review this product after purchasing!</p>
              ) : (
                reviews.map((review: any) => {
                  const isMyReview = currentUser && (
                    review.user?._id === (currentUser as any)._id ||
                    review.user?.id === (currentUser as any)._id ||
                    review.user === (currentUser as any)._id
                  );

                  const isAdmin = currentUser?.role === 'admin';

                  return (
                    <div key={review._id} className="border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-50 font-bold text-indigo-700 flex items-center justify-center text-xs uppercase">
                            {review.user?.name ? review.user.name.substring(0, 2) : 'AN'}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white">{review.user?.name || 'Anonymous User'}</h5>
                            <div className="flex items-center gap-1">
                              <RatingComponent value={review.rating} readOnly size="sm" />
                              <span className="text-[10px] text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isMyReview && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReviewId(review._id);
                                setNewReviewRating(review.rating);
                                setNewReviewComment(review.comment);
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                              title="Edit Review"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                          )}
                          {(isMyReview || isAdmin) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(review._id)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title={isAdmin && !isMyReview ? "Delete / Reject Review (Admin)" : "Delete Review"}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-400">
                        {review.comment}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-12 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Related Products</h2>
            <p className="text-xs text-gray-500">Items frequently purchased together</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
