import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiHeart,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiStar,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiCheckCircle
} from 'react-icons/fi';
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
import Skeleton from '../components/SkeletonLoader';
import { productService, reviewService, mapBackendProduct } from '../services';
import { api } from '../services/api';
import { peacockWallArtFront } from '../assets';

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
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userOrderId, setUserOrderId] = useState<string | undefined>(undefined);

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
        const prod = await productService.getProductByIdOrSlug(id);
        if (!prod) throw new Error('Product not found');

        setProduct(prod);

        // Resolve image URLs with variant tags immediately
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
          const variantImg = urls.find((u) => u.variant === prod.sizes![0]);
          if (variantImg && variantImg.url) setActiveImage(variantImg.url);
        }

        // Fetch reviews and related products concurrently in the background without blocking main UI
        const catId =
          typeof prod.category === 'object' && prod.category !== null
            ? prod.category._id || prod.category.id
            : prod.category;
        const prodId = prod._id || prod.id || '';

        Promise.all([
          reviewService.getProductReviews(prodId),
          catId
            ? productService.getRelatedProducts(String(catId), prodId, 4)
            : Promise.resolve([]),
        ]).then(([productReviews, related]) => {
          setReviews(productReviews);
          setRelatedProducts(related);
        });
      } catch {
        notifyError('Product details could not be loaded. Redirecting to shop.');
        navigate('/shop');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  // Check purchase status for customer to allow reviews
  useEffect(() => {
    if (!currentUser || !product) {
      setHasPurchased(false);
      setUserOrderId(undefined);
      return;
    }
    const checkPurchase = async () => {
      try {
        const prodId = product._id || product.id || '';
        const res = await api.get('/orders/my-orders');
        const orders = res.data?.data?.orders || [];
        const foundOrder = orders.find((o: any) =>
          o.orderStatus !== 'Cancelled' &&
          o.orderItems?.some((item: any) => {
            const pId = typeof item.product === 'object' && item.product
              ? (item.product._id || item.product.id)
              : item.product;
            return pId && prodId && pId.toString() === prodId.toString();
          })
        );
        if (foundOrder || currentUser.role === 'admin') {
          setHasPurchased(true);
          setUserOrderId(foundOrder?._id);
        } else {
          setHasPurchased(false);
          setUserOrderId(undefined);
        }
      } catch {
        setHasPurchased(false);
      }
    };
    checkPurchase();
  }, [currentUser, product]);

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
    const prodId = product._id || product.id || '';
    setIsSubmittingReview(true);
    try {
      if (editingReviewId) {
        await reviewService.updateReview(editingReviewId, newReviewRating, newReviewComment.trim());
        notifySuccess('Review updated successfully!');
      } else {
        await reviewService.submitReview(prodId, newReviewRating, newReviewComment.trim(), '', userOrderId);
        notifySuccess('Review submitted successfully!');
      }
      setNewReviewComment('');
      setNewReviewRating(5);
      setEditingReviewId(null);

      // Refresh product details & reviews via services
      const [updatedProd, revs] = await Promise.all([
        productService.getProductByIdOrSlug(prodId),
        reviewService.getProductReviews(prodId),
      ]);
      if (updatedProd) setProduct(updatedProd);
      setReviews(revs);
    } catch (err: any) {
      notifyError(err.response?.data?.message || err.message || 'Failed to save review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      notifySuccess('Review deleted successfully!');
      const prodId = product?._id || product?.id;
      if (prodId) {
        const [updatedProd, revs] = await Promise.all([
          productService.getProductByIdOrSlug(prodId),
          reviewService.getProductReviews(prodId),
        ]);
        if (updatedProd) setProduct(updatedProd);
        setReviews(revs);
      }
    } catch (err: any) {
      notifyError(err.response?.data?.message || err.message || 'Failed to delete review');
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
    typeof product.brand === 'object' && product.brand !== null
      ? product.brand.name
      : product.brand;

  const isOutOfStock = displayStock <= 0;

  const liveNumReviews = reviews.length;
  const liveAvgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : (product.ratings && typeof product.ratings === 'object'
          ? product.ratings.average
          : (product.ratings as number) || 0);

  // Normalize specifications safely: Array of objects or plain key-value record
  const rawSpecs = product.specifications || product.specs || [];
  const specs: ProductSpec[] = Array.isArray(rawSpecs)
    ? (rawSpecs as ProductSpec[])
    : rawSpecs && typeof rawSpecs === 'object'
    ? Object.entries(rawSpecs).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    : [];

  const myExistingReview = currentUser
    ? reviews.find(
        (r) =>
          r.user?._id === (currentUser as any)._id ||
          r.user?.id === (currentUser as any)._id ||
          r.user === (currentUser as any)._id ||
          r.user?._id === (currentUser as any).id ||
          r.user?.id === (currentUser as any).id ||
          r.user === (currentUser as any).id
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Shop', href: '/shop' },
          { label: categoryName, href: `/shop?category=${encodeURIComponent(categoryName)}` },
          { label: product.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left Side: Product Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <img
              src={activeImage || peacockWallArtFront}
              alt={product.title}
              className="h-full w-full object-cover object-center transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = peacockWallArtFront;
              }}
            />
          </div>

          {imageUrls.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {imageUrls.map((imgObj, idx) => (
                <button
                  key={idx}
                  type="button"
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
              <RatingComponent value={liveAvgRating} size="sm" showNumber />
              <span className="text-xs text-gray-400">|</span>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 transition-colors"
              >
                {liveNumReviews} Verified {liveNumReviews === 1 ? 'Review' : 'Reviews'}
              </button>
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

            {/* Description */}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-6 border-y border-gray-100 dark:border-gray-800 py-6">
            {/* Size Variants */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        const match = imageUrls.find((u) => u.variant === size);
                        if (match && match.url) setActiveImage(match.url);
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

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                  Select Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        const match = imageUrls.find((u) => u.variant.toLowerCase() === color.toLowerCase());
                        if (match && match.url) setActiveImage(match.url);
                      }}
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

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Quantity
              </span>
              <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <FiMinus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
                  disabled={quantity >= displayStock || isOutOfStock}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  <FiPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {isOutOfStock ? (
                  <span className="text-red-500 font-bold">Out of Stock</span>
                ) : (
                  `${displayStock} units available`
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              leftIcon={<FiShoppingCart className="h-4 w-4" />}
              className="flex-1 py-3 text-sm font-bold shadow-md"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button
              variant="outline"
              onClick={handleAddToWishlist}
              leftIcon={
                isInWishlist ? (
                  <FaHeart className="h-4 w-4 text-red-500" />
                ) : (
                  <FiHeart className="h-4 w-4" />
                )
              }
              className={isInWishlist ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 text-red-600 dark:text-red-400' : ''}
            >
              Wishlist
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details Tabs (Specifications & Reviews) */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-8 mb-6">
          <button
            type="button"
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
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold tracking-tight transition-all border-b-2 ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Reviews ({liveNumReviews})
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="max-w-3xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Product Specifications</h3>
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
            {/* Write a Review Section: Only for verified purchasers or admin */}
            {currentUser ? (
              hasPurchased || currentUser.role === 'admin' ? (
                myExistingReview && !editingReviewId ? (
                  <div className="rounded-2xl border border-primary-200 dark:border-primary-900/40 bg-primary-50/40 dark:bg-primary-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300">You reviewed this product</span>
                        <RatingComponent value={myExistingReview.rating} readOnly size="sm" />
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">
                        "{myExistingReview.comment}"
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingReviewId(myExistingReview._id);
                        setNewReviewRating(myExistingReview.rating);
                        setNewReviewComment(myExistingReview.comment);
                      }}
                      leftIcon={<FiEdit2 className="h-3.5 w-3.5" />}
                      className="border-primary-600 text-primary-600 hover:bg-primary-50 shrink-0 font-bold"
                    >
                      Edit Your Review
                    </Button>
                  </div>
                ) : (
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
                          className="w-full sm:w-auto font-bold bg-primary-600 hover:bg-primary-700 text-white"
                        >
                          {isSubmittingReview
                            ? editingReviewId
                              ? 'Updating...'
                              : 'Submitting...'
                            : editingReviewId
                            ? 'Update Review'
                            : 'Submit Review'}
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
                )
              ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-5 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center shrink-0">
                    <FiCheck className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white block mb-0.5 text-sm">
                      Verified Buyer Reviews
                    </span>
                    Reviews can only be submitted by verified customers who have purchased and received this product.
                    If you have already ordered this item, you can review it directly from your{' '}
                    <Link to="/my-orders" className="text-primary-600 font-bold hover:underline">
                      My Orders
                    </Link>{' '}
                    page.
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white block mb-0.5 text-sm">
                    Have you purchased this product?
                  </span>
                  Please log in to your customer account to write a review.
                </div>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shrink-0 text-center"
                >
                  Log In
                </Link>
              </div>
            )}

            {/* List of Customer Reviews */}
            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Customer Reviews ({reviews.length})
              </h4>
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 italic">
                    No reviews yet. Be the first verified customer to review this product!
                  </p>
                </div>
              ) : (
                reviews.map((review: any) => {
                  const isMyReview =
                    currentUser &&
                    (review.user?._id === (currentUser as any)._id ||
                      review.user?.id === (currentUser as any)._id ||
                      review.user === (currentUser as any)._id ||
                      review.user?._id === (currentUser as any).id ||
                      review.user?.id === (currentUser as any).id ||
                      review.user === (currentUser as any).id);

                  const isAdmin = currentUser?.role === 'admin';

                  return (
                    <div
                      key={review._id || review.id}
                      className="border-b border-gray-100 dark:border-gray-800 pb-5 pt-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-950/50 font-bold text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs uppercase shadow-sm">
                            {review.user?.name ? review.user.name.substring(0, 2) : 'CU'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white">
                                {review.user?.name || 'Verified Customer'}
                              </h5>
                              {review.verifiedPurchase && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  <FiCheck className="h-3 w-3" /> Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RatingComponent value={review.rating} readOnly size="sm" />
                              <span className="text-[10px] text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
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
                                window.scrollTo({ top: 450, behavior: 'smooth' });
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
                              title={isAdmin && !isMyReview ? 'Delete / Reject Review (Admin)' : 'Delete Review'}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
