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
import { api } from '../services/api';

// Extend window to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  const [onlineSubMethod, setOnlineSubMethod] = useState<
    'phonepe' | 'gpay' | 'paytm' | 'credit_card' | 'debit_card' | 'qr' | 'upi' | 'wallet' | 'net_banking'
  >('phonepe');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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

  const [existingPendingOrder, setExistingPendingOrder] = useState<any>(null);

  /**
   * Helper to ensure the Razorpay checkout script is loaded
   */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * Opens the Razorpay checkout modal.
   * Called after the backend order is created successfully.
   */
  const openRazorpayCheckout = async (
    razorpayOrderId: string,
    razorpayKeyId: string,
    orderId: string,
    amountInPaisa: number,
    selectedSubMethod: string
  ): Promise<any> => {
    if (!window.Razorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error('Unable to initialize Razorpay checkout. Please check your internet connection or disable ad-blockers and try again.');
      }
    }

    return new Promise((resolve, reject) => {
      const formattedContact = shippingForm.phone
        ? (shippingForm.phone.startsWith('+')
            ? shippingForm.phone
            : `+91${shippingForm.phone.replace(/^0/, '')}`)
        : '';

      // Determine method pre-selection for Razorpay
      let methodPrefill: any = {};
      if (selectedSubMethod === 'credit_card' || selectedSubMethod === 'debit_card') {
        methodPrefill = { method: 'card' };
      } else if (selectedSubMethod === 'wallet') {
        methodPrefill = { method: 'wallet' };
      } else if (selectedSubMethod === 'net_banking') {
        methodPrefill = { method: 'netbanking' };
      } else if (['phonepe', 'gpay', 'paytm', 'qr', 'upi'].includes(selectedSubMethod)) {
        methodPrefill = { method: 'upi' };
      }

      const options: any = {
        key: razorpayKeyId,
        amount: amountInPaisa,
        currency: 'INR',
        name: 'Shree Home Decor',
        description: `Order #${orderId.slice(-8).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: shippingForm.fullName || user?.name || '',
          email: user?.email || '',
          contact: formattedContact,
          ...methodPrefill,
        },
        notes: {
          orderId: orderId,
          customerEmail: user?.email || '',
          selectedSubMethod,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          backdropclose: false,
          escape: false,
          confirm_close: true,
          animation: true,
          ondismiss: () => {
            reject(new Error('Payment window closed. You can retry payment anytime.'));
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Verify the payment on the backend
            const verifyRes = await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            const verifiedOrder = verifyRes?.data?.data?.order;
            resolve(verifiedOrder);
          } catch (err: any) {
            reject(new Error(err?.response?.data?.message || 'Payment verification failed. Please contact support.'));
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        const errorDesc = response?.error?.description || response?.error?.reason || 'Payment failed. Please try a different payment method.';
        notifyError(errorDesc);
        reject(new Error(errorDesc));
      });

      rzp.open();
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      notifyError('Your cart is empty. Add items before placing an order.');
      return;
    }

    if (!shippingForm.street.trim() || !shippingForm.city.trim() || !shippingForm.state.trim() || !shippingForm.postalCode.trim()) {
      notifyError('Please fill in your complete delivery address (street, city, state, postal code).');
      return;
    }

    if (!navigator.onLine) {
      notifyError('Network connection lost. Please check your internet connection and try again.');
      return;
    }

    setIsProcessingPayment(true);

    let order = existingPendingOrder;

    // Step 1: Create the order in our database only if not already created (prevents duplicate orders on retry)
    if (!order) {
      const orderPayload = {
        orderItems: cartItems.map((item) => ({
          product: item.productId || item.id,
          title: item.title,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          variant: { color: item.color, size: item.size },
        })),
        shippingAddress: {
          street: shippingForm.street.trim(),
          city: shippingForm.city.trim(),
          state: shippingForm.state.trim(),
          postalCode: shippingForm.postalCode.trim(),
          country: shippingForm.country || 'India',
          addressType: shippingForm.addressType || 'Home',
        },
        paymentMethod: paymentType === 'COD' ? 'COD' : 'Razorpay',
        itemsPrice: cartTotal,
        taxPrice: parseFloat(tax.toFixed(2)),
        shippingPrice: shipping,
        totalPrice: parseFloat(total.toFixed(2)),
        couponCode: coupon?.couponCode,
      };

      const result = await dispatch(createOrder(orderPayload));

      if (!createOrder.fulfilled.match(result)) {
        setIsProcessingPayment(false);
        const errMsg = (result.payload as string) || 'Failed to place order. Please try again.';
        notifyError(errMsg);
        return;
      }

      order = result.payload;
      setExistingPendingOrder(order);
    }

    // Step 2: If COD, go directly to success
    if (paymentType === 'COD') {
      dispatch(clearCart());
      setIsProcessingPayment(false);
      setExistingPendingOrder(null);
      notifySuccess('Order placed successfully!');
      navigate('/order-success', { state: { order } });
      return;
    }

    // Step 3: Online payment — create Razorpay order and open checkout
    try {
      const { data: rzpData } = await api.post('/payment/razorpay/create-order', {
        amount: order.totalPrice || parseFloat(total.toFixed(2)),
        currency: 'INR',
        orderId: order._id,
      });

      const { razorpayOrderId, amount: rzpAmount, keyId } = rzpData?.data || {};

      if (!razorpayOrderId || !keyId) {
        throw new Error('Failed to create Razorpay order session. Please try again.');
      }

      // Step 4: Open Razorpay checkout modal
      const verifiedOrder = await openRazorpayCheckout(
        razorpayOrderId,
        keyId,
        order._id,
        rzpAmount,
        onlineSubMethod
      );

      // Step 5: Payment verified successfully
      dispatch(clearCart());
      setIsProcessingPayment(false);
      setExistingPendingOrder(null);
      notifySuccess('Payment successful! Your order has been confirmed.');
      navigate('/order-success', {
        state: {
          order: verifiedOrder || {
            ...order,
            isPaid: true,
            orderStatus: 'Confirmed',
            paymentMethod: 'Razorpay',
          },
        },
      });

    } catch (err: any) {
      setIsProcessingPayment(false);
      const serverMessage = err?.response?.data?.message;
      const message = serverMessage || err?.message || 'Payment was not completed. You can retry below or view in My Orders.';
      notifyError(message);
    }
  };

  const isBusy = isCreating || isProcessingPayment;

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
                      <span className="block text-xs text-gray-400">UPI, Cards, Net Banking &amp; more via Razorpay</span>
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
                <div className="mt-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                        Choose Online Payment Method
                      </span>
                      <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                        Processed securely through Razorpay
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      100% Encrypted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'phonepe',
                        title: 'PhonePe',
                        badge: 'UPI App',
                        desc: 'Instant UPI approval via PhonePe app / ID',
                      },
                      {
                        id: 'gpay',
                        title: 'Google Pay (GPay)',
                        badge: 'UPI App',
                        desc: 'Pay using Google Pay app or UPI VPA',
                      },
                      {
                        id: 'paytm',
                        title: 'Paytm',
                        badge: 'UPI / Wallet',
                        desc: 'Paytm UPI, Wallet, or Netbanking',
                      },
                      {
                        id: 'credit_card',
                        title: 'Credit Card',
                        badge: 'Cards',
                        desc: 'Visa, Mastercard, RuPay, Diners, Amex',
                      },
                      {
                        id: 'debit_card',
                        title: 'Debit Card',
                        badge: 'Cards',
                        desc: 'All major Indian bank debit cards',
                      },
                      {
                        id: 'qr',
                        title: 'QR Code',
                        badge: 'Scan & Pay',
                        desc: 'Dynamic BharatQR / UPI QR on screen',
                      },
                      {
                        id: 'upi',
                        title: 'UPI',
                        badge: 'Any App',
                        desc: 'BHIM, CRED, Amazon Pay, or any UPI ID',
                      },
                      {
                        id: 'wallet',
                        title: 'Wallets',
                        badge: 'E-Wallets',
                        desc: 'Mobikwik, Freecharge, Airtel Money & more',
                      },
                      {
                        id: 'net_banking',
                        title: 'Net Banking',
                        badge: '50+ Banks',
                        desc: 'HDFC, SBI, ICICI, Axis, Kotak & more',
                      },
                    ].map((method) => {
                      const isSelected = onlineSubMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setOnlineSubMethod(method.id as any)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            isSelected
                              ? 'border-primary-600 bg-white dark:bg-gray-900 shadow-sm ring-1 ring-primary-500/20'
                              : 'border-gray-200/80 hover:border-gray-300 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="onlineSubMethod"
                            checked={isSelected}
                            onChange={() => setOnlineSubMethod(method.id as any)}
                            className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {method.title}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {method.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {method.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Immediate Action Notice */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200/60 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Selected: <strong className="text-gray-800 dark:text-gray-200">
                        {onlineSubMethod === 'phonepe'
                          ? 'PhonePe UPI'
                          : onlineSubMethod === 'gpay'
                          ? 'Google Pay (GPay)'
                          : onlineSubMethod === 'paytm'
                          ? 'Paytm UPI / Wallet'
                          : onlineSubMethod === 'credit_card'
                          ? 'Credit Card'
                          : onlineSubMethod === 'debit_card'
                          ? 'Debit Card'
                          : onlineSubMethod === 'qr'
                          ? 'QR Code'
                          : onlineSubMethod === 'upi'
                          ? 'UPI'
                          : onlineSubMethod === 'wallet'
                          ? 'Wallets'
                          : 'Net Banking'}
                      </strong>
                    </p>
                    <button
                      type="submit"
                      disabled={cartItems.length === 0 || isBusy}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <span>Pay via {onlineSubMethod === 'phonepe' ? 'PhonePe' : onlineSubMethod === 'gpay' ? 'GPay' : onlineSubMethod === 'paytm' ? 'Paytm' : onlineSubMethod === 'credit_card' ? 'Credit Card' : onlineSubMethod === 'debit_card' ? 'Debit Card' : onlineSubMethod === 'qr' ? 'QR Code' : onlineSubMethod === 'upi' ? 'UPI' : onlineSubMethod === 'wallet' ? 'Wallet' : 'Net Banking'} ({formatCurrency(total)})</span>
                      )}
                    </button>
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

            {existingPendingOrder && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-400 flex items-center justify-between">
                <span>Order #{existingPendingOrder._id.slice(-8).toUpperCase()} created &amp; pending payment.</span>
                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="font-bold underline text-primary-600 dark:text-primary-400 hover:text-primary-700 ml-2"
                >
                  View in Orders
                </button>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={cartItems.length === 0 || isBusy}
            >
              {isCreating
                ? 'Placing Order...'
                : isProcessingPayment
                ? 'Opening Gateway...'
                : existingPendingOrder
                ? `Retry Payment (${formatCurrency(total)})`
                : `Place Order (${formatCurrency(total)})`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
