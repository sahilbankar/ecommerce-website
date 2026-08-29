import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { createOrder } from '../redux/slices/orderSlice';
import { clearCart } from '../redux/slices/cartSlice';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { Input } from '../components/Input';
import { notifySuccess, notifyError } from '../components/Toast';
import Breadcrumb from '../components/Breadcrumb';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartTotal = useSelector((state: RootState) => state.cart.totalAmount);
  const user = useSelector((state: RootState) => state.auth.user);
  const { isCreating } = useSelector((state: RootState) => state.orders);

  const location = useLocation();
  const coupon = location.state as { couponCode?: string, discountType?: string, discountAmount?: number } | undefined;

  let discount = 0;
  if (coupon?.couponCode && coupon.discountAmount) {
    if (coupon.discountType === 'percentage') {
      discount = cartTotal * (coupon.discountAmount / 100);
    } else {
      discount = coupon.discountAmount;
    }
  }

  const tax = Math.max(0, (cartTotal - discount) * 0.08);
  const shipping = cartTotal > 150 || cartTotal === 0 ? 0 : 15.0;
  const total = Math.max(0, cartTotal - discount + tax + shipping);

  const [paymentType, setPaymentType] = useState<'Online' | 'COD'>('Online');
  const [onlineMethod, setOnlineMethod] = useState<'PhonePe' | 'GPay' | 'Paytm'>('PhonePe');
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.name || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'Home',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      notifyError('Your cart is empty. Add items before placing an order.');
      return;
    }

    const selectedPaymentMethod = paymentType === 'COD' ? 'COD' : onlineMethod;

    const orderPayload = {
      orderItems: cartItems.map((item) => ({
        product: item.productId,
        price: item.price,
        quantity: item.quantity,
        variant: { color: item.color, size: item.size },
      })),
      shippingAddress: {
        street: shippingForm.street,
        city: shippingForm.city,
        state: shippingForm.state,
        postalCode: shippingForm.postalCode,
        country: shippingForm.country || 'India',
        addressType: shippingForm.addressType || 'Home',
      },
      paymentMethod: selectedPaymentMethod,
      itemsPrice: cartTotal,
      taxPrice: parseFloat(tax.toFixed(2)),
      shippingPrice: shipping,
      totalPrice: parseFloat(total.toFixed(2)),
      couponCode: coupon?.couponCode,
    };

    const result = await dispatch(createOrder(orderPayload));

    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      notifySuccess('Order placed successfully!');
      navigate('/order-success', { state: { order: result.payload } });
    } else {
      const errMsg = (result.payload as string) || 'Failed to place order. Please try again.';
      notifyError(errMsg);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout', href: '/checkout' },
        ]}
      />

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Checkout</h1>

      {cartItems.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <p className="text-amber-700 dark:text-amber-400 font-semibold">Your cart is empty.</p>
          <Button className="mt-3" onClick={() => navigate('/shop')}>Browse Products</Button>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Shipping & Payment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                value={shippingForm.fullName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                value={shippingForm.phone}
                onChange={handleInputChange}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  name="street"
                  value={shippingForm.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Input
                label="City"
                name="city"
                value={shippingForm.city}
                onChange={handleInputChange}
                required
              />
              <Input
                label="State / Province"
                name="state"
                value={shippingForm.state}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Postal / Zip Code"
                name="postalCode"
                value={shippingForm.postalCode}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Country"
                name="country"
                value={shippingForm.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Payment Method
            </h3>

            <div className="space-y-4">
              {/* Main Selection Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Online Payment Option */}
                <div
                  onClick={() => setPaymentType('Online')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentType === 'Online'
                      ? 'border-primary-600 bg-primary-50/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === 'Online'}
                      onChange={() => setPaymentType('Online')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">Online Payment</span>
                      <span className="block text-xs text-gray-400">Pay via PhonePe, GPay, or Paytm</span>
                    </div>
                  </div>
                </div>

                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentType('COD')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentType === 'COD'
                      ? 'border-primary-600 bg-primary-50/10'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      checked={paymentType === 'COD'}
                      onChange={() => setPaymentType('COD')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">Cash on Delivery (COD)</span>
                      <span className="block text-xs text-gray-400">Pay with cash upon package receipt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-options for Online Payment */}
              {paymentType === 'Online' && (
                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Select Online Payment Option
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* PhonePe */}
                    <div
                      onClick={() => setOnlineMethod('PhonePe')}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                        onlineMethod === 'PhonePe'
                          ? 'border-purple-600 bg-purple-50/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="onlineMethod"
                        checked={onlineMethod === 'PhonePe'}
                        onChange={() => setOnlineMethod('PhonePe')}
                        className="h-3.5 w-3.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">PhonePe</span>
                        <span className="text-[10px] opacity-75">UPI Payment</span>
                      </div>
                    </div>

                    {/* Google Pay */}
                    <div
                      onClick={() => setOnlineMethod('GPay')}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                        onlineMethod === 'GPay'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="onlineMethod"
                        checked={onlineMethod === 'GPay'}
                        onChange={() => setOnlineMethod('GPay')}
                        className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Google Pay</span>
                        <span className="text-[10px] opacity-75">GPay UPI</span>
                      </div>
                    </div>

                    {/* Paytm */}
                    <div
                      onClick={() => setOnlineMethod('Paytm')}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                        onlineMethod === 'Paytm'
                          ? 'border-sky-600 bg-sky-50/20 text-sky-700 dark:text-sky-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="onlineMethod"
                        checked={onlineMethod === 'Paytm'}
                        onChange={() => setOnlineMethod('Paytm')}
                        className="h-3.5 w-3.5 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Paytm</span>
                        <span className="text-[10px] opacity-75">Wallet / UPI</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Order Summary
            </h3>

            <div className="space-y-3.5 max-h-60 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No items in cart</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-9 w-9 object-cover rounded-lg border border-gray-100 dark:border-gray-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white line-clamp-1">
                          {item.title}
                        </span>
                        <span className="text-gray-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-950 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({coupon?.couponCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Tax (8%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 text-sm font-extrabold text-gray-950 dark:text-white">
                <span>Total Amount Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={cartItems.length === 0 || isCreating}
            >
              {isCreating ? 'Placing Order...' : `Place Order (${formatCurrency(total)})`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
