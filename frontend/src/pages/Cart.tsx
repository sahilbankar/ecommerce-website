import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi';
import { RootState, AppDispatch } from '../redux/store';
import {
  fetchCart,
  updateQuantityAsync,
  removeCartItemAsync,
  clearCartAsync,
  CartItem,
} from '../redux/slices/cartSlice';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { notifySuccess, notifyError } from '../components/Toast';
import { api } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import EmptyState from '../components/EmptyState';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items: cartItems, totalAmount, totalQuantity, isLoading } = useSelector(
    (state: RootState) => state.cart
  );

  const [couponCode, setCouponCode] = useState('');
  // @ts-ignore
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discountType: string, discountAmount: number, calculatedDiscount: number} | null>(null);

  // Fetch real cart on mount
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleUpdateQty = (item: CartItem, diff: number) => {
    const nextQty = item.quantity + diff;
    if (nextQty > 0 && nextQty <= item.stock) {
      dispatch(
        updateQuantityAsync({
          id: item.id,
          cartItemId: item.cartItemId,
          quantity: nextQty,
        })
      );
    } else if (nextQty > item.stock) {
      notifyError(`Only ${item.stock} units available in stock.`);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    dispatch(
      removeCartItemAsync({
        id: item.id,
        cartItemId: item.cartItemId,
      })
    );
    notifySuccess(`Removed ${item.title} from Cart!`);
  };

  const handleClearCart = () => {
    dispatch(clearCartAsync());
    notifySuccess('Cart cleared successfully!');
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'PROMO20') {
      setAppliedCoupon({code: 'PROMO20', discountType: 'percentage', discountAmount: 20, calculatedDiscount: 0});
      notifySuccess('Coupon code PROMO20 applied! You received a 20% discount.');
    } else {
      notifyError('Invalid coupon code. Try entering "PROMO20".');
    }
  };

  const subtotal = totalAmount;
  const discountAmount = appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? subtotal * (appliedCoupon.discountAmount / 100) : appliedCoupon.discountAmount) : 0;
  const shippingFee = subtotal > 150 || subtotal === 0 ? 0 : 15.0;
  const taxAmount = (subtotal - discountAmount) * 0.08;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + taxAmount);

  if (isLoading && cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-500">Loading your shopping cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Your Cart is Empty"
          description="Looks like you haven't added any products to your cart yet. Head over to our catalog to find hot collections."
          actionLabel="Continue Shopping"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Shopping Cart', href: '/cart' }]} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Shopping Cart ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={handleClearCart}
          className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <Link
                    to={item.slug ? `/product/${item.slug}` : `/product/${item.productId}`}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-800 block"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </Link>

                  <div className="flex-1 space-y-1">
                    <div
                      className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1"
                    >
                      {item.title}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span>
                        Color: <strong>{item.color || 'Standard'}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        Size: <strong>{item.size || 'Standard'}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        Stock: <strong>{item.stock}</strong>
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Unit Price: {formatCurrency(item.price)}
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                      onClick={() => handleUpdateQty(item, -1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40"
                    >
                      <FiMinus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item, 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40"
                    >
                      <FiPlus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Item Total Price */}
                  <div className="text-right sm:min-w-[90px]">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg self-end sm:self-center transition-colors"
                    aria-label="Remove item"
                    title="Remove from Cart"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary Invoice Box */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Summary</h3>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountAmount}%` : `₹${appliedCoupon.discountAmount}`})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {shippingFee === 0 ? 'Free' : formatCurrency(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between text-base font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Promo Code form */}
            <form
              onSubmit={handleApplyCoupon}
              className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-4"
            >
              <input
                type="text"
                placeholder="PROMO20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <Button type="submit" variant="secondary" size="sm">
                Apply
              </Button>
            </form>

            <Button
              fullWidth
              size="lg"
              onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code, discountType: appliedCoupon?.discountType, discountAmount: appliedCoupon?.discountAmount } })}
              rightIcon={<FiArrowRight />}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
