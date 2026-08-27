import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import { RatingComponent } from './RatingComponent';
import Button from './Button';
import { AppDispatch, RootState } from '../redux/store';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { toggleWishlistAsync } from '../redux/slices/wishlistSlice';
import { notifySuccess, notifyError } from './Toast';

export interface ProductCardProps {
  product: Product;
  isInWishlist?: boolean;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isInWishlist: propIsInWishlist,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  className = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const wishlistItems = useSelector((state: RootState) => state.wishlist?.items || []);
  const prodId = product._id || product.id;

  const isSavedInWishlist =
    propIsInWishlist !== undefined
      ? propIsInWishlist
      : wishlistItems.some((item) => (item._id || item.id) === prodId);

  const {
    id,
    title,
    slug,
    price,
    discountPrice,
    stock,
    category,
    brand,
    images,
    ratings,
    numReviews,
    isNew,
  } = product;

  // Handle both string[] (mock data) and {url, public_id}[] (backend/Cloudinary format)
  const resolveImageUrl = (img: unknown): string => {
    if (typeof img === 'string' && img.trim()) return img.trim();
    if (img && typeof img === 'object' && 'url' in img) {
      const url = (img as { url?: string }).url;
      if (typeof url === 'string' && url.trim()) return url.trim();
    }
    return '';
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

  const firstImg = images && images.length > 0 ? resolveImageUrl(images[0]) : '';
  const mainImage = firstImg || fallbackImage;

  const categoryName = typeof category === 'string' ? category : category?.name;
  const isOutOfStock = stock <= 0;
  const discountPercent = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      dispatch(addToCartAsync({ product, quantity: 1 }));
      notifySuccess(`Added ${title} to Cart!`);
    }
  };

  const handleWishlistToggleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    } else {
      try {
        const result = await dispatch(toggleWishlistAsync(product)).unwrap();
        if (result.added) {
          notifySuccess(`Added ${title} to Wishlist!`);
        } else {
          notifySuccess(`Removed ${title} from Wishlist!`);
        }
      } catch (err: any) {
        notifyError(err || 'Failed to update wishlist');
      }
    }
  };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={mainImage}
          alt={title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isNew && (
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
              NEW
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-md bg-gray-900/90 px-2 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm dark:bg-gray-100/90 dark:text-gray-900">
              Out of Stock
            </span>
          )}
        </div>

        {/* Action Overlay Buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={handleWishlistToggleClick}
            aria-label="Wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white hover:text-red-500 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {isSavedInWishlist ? (
              <FaHeart className="h-4 w-4 text-red-500" />
            ) : (
              <FiHeart className="h-4 w-4" />
            )}
          </button>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label="Quick View"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white hover:text-primary-600 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FiEye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Subtitle / Category */}
          <div className="flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
            <span>{categoryName || brand || 'General'}</span>
          </div>

          {/* Title */}
          <Link
            to={`/product/${slug || id}`}
            className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
          >
            {title}
          </Link>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1">
            <RatingComponent value={ratings} size="sm" showNumber reviewCount={numReviews} />
          </div>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {discountPrice ? (
              <>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(discountPrice)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(price)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          <Button
            size="sm"
            disabled={isOutOfStock}
            onClick={handleAddToCartClick}
            leftIcon={<FiShoppingCart className="h-4 w-4" />}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
