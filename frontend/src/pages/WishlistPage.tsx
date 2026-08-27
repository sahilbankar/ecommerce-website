import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiTrash2, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { RootState, AppDispatch } from '../redux/store';
import {
  fetchWishlist,
  removeFromWishlistAsync,
  clearWishlistAsync,
} from '../redux/slices/wishlistSlice';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { Product } from '../types';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import Breadcrumb from '../components/Breadcrumb';
import EmptyState from '../components/EmptyState';

const fallbackImage =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

const resolveImageUrl = (images?: any[]): string => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallbackImage;
  }
  for (const img of images) {
    if (typeof img === 'string' && img.trim()) return img.trim();
    if (img && typeof img === 'object') {
      const url = (img as { url?: string }).url;
      if (typeof url === 'string' && url.trim()) return url.trim();
    }
  }
  return fallbackImage;
};

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items: wishlistItems, isLoading } = useSelector(
    (state: RootState) => state.wishlist
  );

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleAddToCart = (product: Product) => {
    dispatch(addToCartAsync({ product, quantity: 1 }));
    notifySuccess(`Added ${product.title} to Cart!`);
  };

  const handleRemoveItem = async (product: Product) => {
    const prodId = product._id || product.id;
    try {
      await dispatch(removeFromWishlistAsync(prodId)).unwrap();
      notifySuccess(`Removed ${product.title} from Wishlist!`);
    } catch (err: any) {
      notifyError(err || 'Failed to remove from wishlist');
    }
  };

  const handleClearAll = async () => {
    try {
      await dispatch(clearWishlistAsync()).unwrap();
      notifySuccess('Wishlist cleared successfully!');
    } catch (err: any) {
      notifyError(err || 'Failed to clear wishlist');
    }
  };

  if (isLoading && wishlistItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-500">Loading your wishlist...</p>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={<FiHeart className="h-8 w-8 text-red-500" />}
          title="Your Wishlist is Empty"
          description="Save items you like to track price discounts and stock updates here."
          actionLabel="Go to Catalog"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Wishlist', href: '/wishlist' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Keep track of items you plan to buy later.
          </p>
        </div>
        {wishlistItems.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Clear Wishlist
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {wishlistItems.map((product) => {
            const prodId = product._id || product.id;
            const isOutOfStock = product.stock <= 0;
            const imgUrl = resolveImageUrl(product.images);

            return (
              <div
                key={prodId}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                {/* Product Detail Thumbnail */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-800">
                    <img
                      src={imgUrl}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <Link
                      to={product.slug ? `/product/${product.slug}` : `/product/${prodId}`}
                      className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-1"
                    >
                      {product.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm text-primary-600 dark:text-primary-400">
                        {formatCurrency(
                          product.discountPrice && product.discountPrice > 0
                            ? product.discountPrice
                            : product.price
                        )}
                      </span>
                      {product.discountPrice && product.discountPrice > 0 ? (
                        <span className="text-xs text-gray-400 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      ) : null}
                      {isOutOfStock && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(product)}
                    leftIcon={<FiShoppingCart className="h-4 w-4" />}
                  >
                    Add to Cart
                  </Button>
                  <button
                    onClick={() => handleRemoveItem(product)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-red-950/10 rounded-lg transition-colors"
                    aria-label="Remove item"
                    title="Remove from Wishlist"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
