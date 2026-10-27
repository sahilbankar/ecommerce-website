import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { fetchMyOrders, cancelOrderAsync, deleteOrderAsync, Order } from '../redux/slices/orderSlice';
import { formatCurrency } from '../utils';
import Button from '../components/Button';
import { api } from '../services/api';
import { notifySuccess, notifyError } from '../components/Toast';
import Breadcrumb from '../components/Breadcrumb';
import {
  FiPackage,
  FiXCircle,
  FiRefreshCw,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiX,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiTruck,
  FiTrash2
} from 'react-icons/fi';

const getProductId = (prod: any): string => {
  if (!prod) return "";
  if (typeof prod === "string") return prod;
  if (typeof prod === "object" && prod._id) return String(prod._id);
  if (typeof prod === "object" && prod.id) return String(prod.id);
  return String(prod);
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
    case 'Shipped':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400';
    case 'Processing':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
    case 'Confirmed':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400';
    case 'Cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400';
    case 'Out for Delivery':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400';
  }
};

const renderStatusTracker = (status: string) => {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center justify-center gap-2 text-red-500 py-4 bg-red-50 dark:bg-red-950/20 rounded-xl my-2">
        <FiXCircle className="h-5 w-5" />
        <span className="text-sm font-semibold">Order Cancelled</span>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center justify-between w-full max-w-xl mx-auto pt-4 pb-2">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = currentStepIndex !== -1 && idx <= currentStepIndex;
        const isCurrent = currentStepIndex !== -1 && idx === currentStepIndex;

        return (
          <div key={step} className="flex-1 flex flex-col items-center relative">
            {idx > 0 && (
              <div
                className={`absolute top-2.5 right-1/2 translate-y-0 h-0.5 w-full -z-10 ${
                  isDone ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              />
            )}
            <div
              className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                isCurrent
                  ? 'border-primary-600 bg-white text-primary-600 animate-pulse dark:bg-gray-900'
                  : isDone
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-950'
              }`}
            >
              {isDone && !isCurrent ? <FiCheck className="h-3 w-3" /> : idx + 1}
            </div>
            <span
              className={`text-[9px] mt-1.5 font-semibold text-center leading-tight ${
                isCurrent
                  ? 'text-primary-600 font-bold'
                  : isDone
                  ? 'text-gray-800 dark:text-gray-200'
                  : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const MyOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, isLoading, isCancelling, error } = useSelector((state: RootState) => state.orders);
  
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [reviewModal, setReviewModal] = useState<{ orderId: string; productId: string; title: string; image: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const user = useSelector((state: RootState) => state.auth?.user);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  // Check for existing review when reviewModal opens
  useEffect(() => {
    if (!reviewModal) {
      setExistingReviewId(null);
      setComment('');
      setRating(5);
      return;
    }
    const checkReview = async () => {
      try {
        const prodId = getProductId(reviewModal.productId);
        const res = await api.get(`/reviews?productId=${prodId}`);
        const reviews = res.data?.data?.reviews || [];
        const myRev = reviews.find((r: any) =>
          r.user?._id === user?._id || r.user?.id === user?._id || r.user === user?._id
        );
        if (myRev) {
          setExistingReviewId(myRev._id);
          setRating(myRev.rating || 5);
          setComment(myRev.comment || '');
        } else {
          setExistingReviewId(null);
          setRating(5);
          setComment('');
        }
      } catch {
        setExistingReviewId(null);
      }
    };
    checkReview();
  }, [reviewModal, user]);

  const handleSubmitReview = async () => {
    if (!reviewModal || !rating || !comment.trim()) return;
    setIsSubmittingReview(true);
    try {
      if (existingReviewId) {
        await api.put(`/reviews/${existingReviewId}`, {
          rating,
          comment: comment.trim()
        });
        notifySuccess('Review updated successfully!');
      } else {
        await api.post('/reviews', {
          orderId: reviewModal.orderId,
          productId: getProductId(reviewModal.productId),
          rating,
          comment: comment.trim()
        });
        notifySuccess('Review submitted successfully!');
      }
      setReviewModal(null);
      setComment('');
      setRating(5);
      dispatch(fetchMyOrders());
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReviewId) return;
    if (!window.confirm('Are you sure you want to cancel and delete your review?')) return;
    setIsDeletingReview(true);
    try {
      await api.delete(`/reviews/${existingReviewId}`);
      notifySuccess('Review cancelled & removed successfully!');
      setReviewModal(null);
      setExistingReviewId(null);
      setComment('');
      setRating(5);
      dispatch(fetchMyOrders());
    } catch (err: any) {
      notifyError(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setIsDeletingReview(false);
    }
  };

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    const result = await dispatch(cancelOrderAsync(orderId));
    setCancellingId(null);
    setConfirmCancelId(null);
    if (cancelOrderAsync.fulfilled.match(result)) {
      notifySuccess('Order cancelled successfully. Stock has been restored.');
      if (selectedOrderModal && selectedOrderModal?._id === orderId) {
        setSelectedOrderModal(result.payload);
      }
    } else {
      notifyError((result.payload as string) || 'Failed to cancel order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    const result = await dispatch(deleteOrderAsync(orderId));
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (deleteOrderAsync.fulfilled.match(result)) {
      notifySuccess('Order deleted successfully.');
      setSelectedOrderModal(null);
    } else {
      notifyError((result.payload as string) || 'Failed to delete order');
    }
  };

  const canCancel = (order: Order) =>
    !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.orderStatus);

  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const handleRetryPayment = async (orderToPay: Order) => {
    if (!navigator.onLine) {
      notifyError('Network connection lost. Please check your internet connection.');
      return;
    }

    setRetryingOrderId(orderToPay._id);
    try {
      // Ensure Razorpay SDK is ready or dynamically inject it
      if (!window.Razorpay) {
        const loaded = await new Promise<boolean>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
        if (!loaded || !window.Razorpay) {
          throw new Error('Unable to initialize Razorpay checkout. Please check your connection or disable ad-blockers.');
        }
      }

      const { data: rzpData } = await api.post('/payment/razorpay/create-order', {
        amount: orderToPay.totalPrice,
        currency: 'INR',
        orderId: orderToPay._id,
      });

      const { razorpayOrderId, amount: rzpAmount, keyId } = rzpData?.data || {};
      if (!razorpayOrderId || !keyId) {
        throw new Error('Failed to initiate payment session. Please try again.');
      }

      const options = {
        key: keyId,
        amount: rzpAmount,
        currency: 'INR',
        name: 'Shree Home Decor',
        description: `Order #${orderToPay._id.slice(-8).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        notes: {
          orderId: orderToPay._id,
          customerEmail: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
          backdrop_color: 'rgba(0,0,0,0.6)',
        },
        modal: {
          backdropclose: false,
          escape: false,
          confirm_close: true,
          animation: true,
          ondismiss: () => {
            notifyError('Payment window closed. You can retry anytime.');
            setRetryingOrderId(null);
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
            await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderToPay._id,
            });
            notifySuccess('Payment successful! Your order has been confirmed.');
            dispatch(fetchMyOrders());
            if (selectedOrderModal && selectedOrderModal._id === orderToPay._id) {
              setSelectedOrderModal((prev) => prev ? { ...prev, isPaid: true, orderStatus: 'Processing' } : null);
            }
          } catch (err: any) {
            notifyError(err?.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setRetryingOrderId(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        const errorDesc = response?.error?.description || response?.error?.reason || 'Payment failed. Please try a different payment method.';
        notifyError(errorDesc);
        setRetryingOrderId(null);
      });
      rzp.open();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to open payment gateway.');
      setRetryingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin mx-auto" />
        <p className="mt-3 text-sm text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb items={[{ label: 'My Orders', href: '/orders' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Check Order / My Orders</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review order details, track current shipping status, or cancel active orders.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch(fetchMyOrders())}
          leftIcon={<FiRefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {orders.length === 0 && !error && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-16 text-center">
          <FiPackage className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders found</h3>
          <p className="text-sm text-gray-500 mt-1">Your placed orders will appear here.</p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Order Header */}
            <div className="bg-gray-50 dark:bg-gray-800/40 px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Order ID</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Order Placed</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Total Amount</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{formatCurrency(order.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase tracking-wider">Payment</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                    {order.paymentMethod}{' '}
                    <span className={`ml-1 text-[11px] font-extrabold ${order.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      ({order.isPaid ? 'Paid' : 'Pending'})
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus}
                </span>

                {/* Cancel Order Option */}
                {canCancel(order) && (
                  <>
                    {confirmCancelId === order._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Are you sure?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmCancelId(null)}
                        >
                          No
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling && cancellingId === order._id}
                          className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white"
                        >
                          {isCancelling && cancellingId === order._id ? 'Cancelling...' : 'Yes, Cancel'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmCancelId(order._id)}
                        leftIcon={<FiXCircle className="h-3.5 w-3.5 text-red-500" />}
                        className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-900 dark:!text-red-400"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </>
                )}
                {/* Pay Now Button for Unpaid Orders */}
                {order.paymentMethod !== 'COD' && !order.isPaid && order.orderStatus !== 'Cancelled' && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryPayment(order)}
                    disabled={retryingOrderId === order._id}
                    leftIcon={<FiCreditCard className="h-3.5 w-3.5" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  >
                    {retryingOrderId === order._id ? 'Opening...' : 'Pay Now'}
                  </Button>
                )}
                {/* Check Order Button */}
                <Button
                  size="sm"
                  onClick={() => setSelectedOrderModal(order)}
                  leftIcon={<FiEye className="h-3.5 w-3.5" />}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Check Order
                </Button>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50 px-5">
              {order.orderItems.map((item, idx) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-14 w-14 object-cover rounded-xl border border-gray-100 dark:border-gray-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Qty: {item.quantity} · {formatCurrency(item.price)} each
                        {item.variant?.color || item.variant?.size ? ` · (${[item.variant.color, item.variant.size].filter(Boolean).join(', ')})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Tracker & Quick Actions */}
            <div className="border-t border-gray-50 dark:border-gray-800/40 p-5">
              {renderStatusTracker(order.orderStatus)}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/40 justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOrderModal(order)}
                  leftIcon={<FiEye className="h-3.5 w-3.5" />}
                >
                  View Details ("Check Order")
                </Button>

                {order.orderStatus !== 'Cancelled' && (
                  <div className="flex flex-wrap items-center gap-2">
                    {!order.orderItems.every(i => i.isReviewed) ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          const unreviewed = order.orderItems.find(i => !i.isReviewed) || order.orderItems[0];
                          if (unreviewed) {
                            setReviewModal({
                              orderId: order._id,
                              productId: unreviewed.product,
                              title: unreviewed.title,
                              image: unreviewed.image
                            });
                          }
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold"
                      >
                        Write Review
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mr-1">
                        <FiCheck className="h-4 w-4" /> Reviewed
                      </span>
                    )}

                    {order.orderItems.some(i => i.isReviewed) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reviewedItem = order.orderItems.find(i => i.isReviewed) || order.orderItems[0];
                            if (reviewedItem) {
                              setReviewModal({
                                orderId: order._id,
                                productId: reviewedItem.product,
                                title: reviewedItem.title,
                                image: reviewedItem.image
                              });
                            }
                          }}
                          className="border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 font-bold"
                        >
                          Edit Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const reviewedItem = order.orderItems.find(i => i.isReviewed) || order.orderItems[0];
                            if (!reviewedItem) return;
                            if (!window.confirm('Are you sure you want to cancel?')) return;
                            try {
                              const prodId = getProductId(reviewedItem.product);
                              const res = await api.get(`/reviews?productId=${prodId}`);
                              const reviews = res.data?.data?.reviews || [];
                              const myRev = reviews.find((r: any) =>
                                r.user?._id === user?._id || r.user?.id === user?._id || r.user === user?._id
                              );
                              if (myRev) {
                                await api.delete(`/reviews/${myRev._id}`);
                                notifySuccess('Review deleted successfully!');
                                dispatch(fetchMyOrders());
                              } else {
                                notifyError('Review not found');
                              }
                            } catch (err: any) {
                              notifyError(err.response?.data?.message || 'Failed to delete review');
                            }
                          }}
                          className="border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Cancel Order Option */}
                {canCancel(order) && (
                  <>
                    {confirmCancelId === order._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Are you sure?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmCancelId(null)}
                        >
                          No
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={isCancelling && cancellingId === order._id}
                          className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white"
                        >
                          {isCancelling && cancellingId === order._id ? 'Cancelling...' : 'Yes, Cancel'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmCancelId(order._id)}
                        leftIcon={<FiXCircle className="h-3.5 w-3.5 text-red-500" />}
                        className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-900 dark:!text-red-400"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </>
                )}

                {/* Delete Order Option */}
                {order.orderStatus === 'Cancelled' && (
                  <>
                    {confirmDeleteId === order._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete order?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          No
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteOrder(order._id)}
                          disabled={deletingId === order._id}
                          className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white"
                        >
                          {deletingId === order._id ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteId(order._id)}
                        leftIcon={<FiTrash2 className="h-3.5 w-3.5 text-red-500" />}
                        className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-900 dark:!text-red-400"
                      >
                        Delete Order
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Check Order / Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedOrderModal(null);
              setConfirmCancelId(null);
            }}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto z-10 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiPackage className="h-5 w-5 text-primary-600" />
                  Order Details
                </h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5">
                  Order ID: #{selectedOrderModal?._id.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderModal(null);
                  setConfirmCancelId(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Current Order Status Banner */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FiClock className="h-4 w-4 text-primary-500" /> Current Order Status
                </span>
                <span className={`rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(selectedOrderModal?.orderStatus)}`}>
                  {selectedOrderModal?.orderStatus}
                </span>
              </div>
              {renderStatusTracker(selectedOrderModal?.orderStatus)}
              {selectedOrderModal?.trackingNumber && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <FiTruck className="h-4 w-4 text-primary-500" />
                  <span className="font-semibold">Tracking Number:</span>
                  <span className="font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 font-bold">
                    {selectedOrderModal?.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Order & Product Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Product Details</h4>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                {selectedOrderModal?.orderItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-100 dark:border-gray-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                        <p className="text-xs text-gray-400">
                          Price: {formatCurrency(item.price)} · Qty: <span className="font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                          {item.variant?.color || item.variant?.size ? ` · (${[item.variant.color, item.variant.size].filter(Boolean).join(', ')})` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white mr-2">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      {!item.isReviewed ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrderModal(null);
                            setReviewModal({
                              orderId: selectedOrderModal._id,
                              productId: item.product,
                              title: item.title,
                              image: item.image
                            });
                          }}
                          className="bg-primary-600 hover:bg-primary-700 text-white font-bold"
                        >
                          Write Review
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrderModal(null);
                              setReviewModal({
                                orderId: selectedOrderModal._id,
                                productId: item.product,
                                title: item.title,
                                image: item.image
                              });
                            }}
                            className="border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 font-bold"
                          >
                            Edit Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!window.confirm('Are you sure you want to cancel?')) return;
                              try {
                                const prodId = getProductId(item.product);
                                const res = await api.get(`/reviews?productId=${prodId}`);
                                const reviews = res.data?.data?.reviews || [];
                                const myRev = reviews.find((r: any) =>
                                  r.user?._id === user?._id || r.user?.id === user?._id || r.user === user?._id
                                );
                                if (myRev) {
                                  await api.delete(`/reviews/${myRev._id}`);
                                  notifySuccess('Review deleted successfully!');
                                  setSelectedOrderModal(null);
                                  dispatch(fetchMyOrders());
                                } else {
                                  notifyError('Review not found');
                                }
                              } catch (err: any) {
                                notifyError(err.response?.data?.message || 'Failed to delete review');
                              }
                            }}
                            className="border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid for Payment & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Information */}
              <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FiCreditCard className="h-4 w-4 text-primary-500" /> Payment Information
                </h4>
                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{selectedOrderModal?.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status:</span>
                    <span className={`font-bold ${selectedOrderModal?.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {selectedOrderModal?.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  {selectedOrderModal?.isPaid && selectedOrderModal?.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Paid At:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(selectedOrderModal?.paidAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FiMapPin className="h-4 w-4 text-primary-500" /> Delivery Information
                </h4>
                <div className="text-xs text-gray-700 dark:text-gray-300 pt-1 space-y-0.5">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {selectedOrderModal?.shippingAddress?.addressType ? `[${selectedOrderModal?.shippingAddress.addressType}] ` : ''}Shipping Address:
                  </p>
                  <p>{selectedOrderModal?.shippingAddress?.street}</p>
                  <p>
                    {selectedOrderModal?.shippingAddress?.city}, {selectedOrderModal?.shippingAddress?.state} {selectedOrderModal?.shippingAddress?.postalCode}
                  </p>
                  <p className="font-semibold">{selectedOrderModal?.shippingAddress?.country || 'India'}</p>
                </div>
              </div>
            </div>

            {/* Total Amount Breakdown */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Total Amount Breakdown</h4>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Items Subtotal</span>
                <span>{formatCurrency(selectedOrderModal?.itemsPrice || selectedOrderModal?.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping Fee</span>
                <span>{selectedOrderModal?.shippingPrice === 0 ? 'FREE' : formatCurrency(selectedOrderModal?.shippingPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax</span>
                <span>{formatCurrency(selectedOrderModal?.taxPrice || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>Total Amount Paid / Payable</span>
                <span className="text-primary-600 dark:text-primary-400">{formatCurrency(selectedOrderModal?.totalPrice)}</span>
              </div>
              {selectedOrderModal?.cancellationReason && (
                <div className="flex justify-between text-xs font-semibold text-red-600 dark:text-red-400 pt-1">
                  <span>Cancellation Reason</span>
                  <span>{selectedOrderModal.cancellationReason}</span>
                </div>
              )}
            </div>

            {/* Cancel Order Action inside Modal */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Created on {formatDate(selectedOrderModal?.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                {selectedOrderModal?.paymentMethod !== 'COD' && !selectedOrderModal?.isPaid && selectedOrderModal?.orderStatus !== 'Cancelled' && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryPayment(selectedOrderModal)}
                    disabled={retryingOrderId === selectedOrderModal._id}
                    leftIcon={<FiCreditCard className="h-4 w-4" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {retryingOrderId === selectedOrderModal._id ? 'Opening...' : 'Pay Now'}
                  </Button>
                )}

                {canCancel(selectedOrderModal) ? (
                  <>
                    {confirmCancelId === selectedOrderModal?._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Confirm cancellation?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmCancelId(null)}
                        >
                          No
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCancelOrder(selectedOrderModal?._id)}
                          disabled={isCancelling && cancellingId === selectedOrderModal?._id}
                          className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white"
                        >
                          {isCancelling && cancellingId === selectedOrderModal?._id ? 'Cancelling...' : 'Yes, Cancel Order'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setConfirmCancelId(selectedOrderModal?._id)}
                        leftIcon={<FiXCircle className="h-4 w-4" />}
                        className="!bg-red-600 hover:!bg-red-700 text-white font-bold"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </>
                ) : selectedOrderModal?.orderStatus === 'Cancelled' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg flex items-center gap-1">
                    <FiXCircle className="h-4 w-4" /> Cancelled
                  </span>
                  {confirmDeleteId === selectedOrderModal?._id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Delete permanently?</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteOrder(selectedOrderModal?._id)}
                        disabled={deletingId === selectedOrderModal?._id}
                        className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white"
                      >
                        {deletingId === selectedOrderModal?._id ? 'Deleting...' : 'Yes, Delete'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setConfirmDeleteId(selectedOrderModal?._id)}
                      leftIcon={<FiTrash2 className="h-4 w-4" />}
                      className="!bg-red-600 hover:!bg-red-700 text-white font-bold"
                    >
                      Delete Order
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500 italic">
                  Order cannot be cancelled ({selectedOrderModal?.orderStatus})
                </span>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{existingReviewId ? "Edit Your Review" : "Write a Review"}</h3>
              <button onClick={() => setReviewModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <img src={reviewModal.image} alt={reviewModal.title} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{reviewModal.title}</p>
                <p className="text-xs text-gray-500 mt-1">Share your experience with this product.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <svg
                        className={`h-8 w-8 ${star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Review Comment</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? What is it used for?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSubmitReview}
                  disabled={!comment.trim() || isSubmittingReview || isDeletingReview}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700"
                >
                  {isSubmittingReview
                    ? 'Saving...'
                    : existingReviewId
                    ? 'Update Review'
                    : 'Submit Review'}
                </Button>

                {existingReviewId && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteReview}
                    disabled={isSubmittingReview || isDeletingReview}
                    leftIcon={<FiTrash2 className="h-4 w-4" />}
                    className="border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {isDeletingReview ? 'Deleting...' : 'Delete Review'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setReviewModal(null)}
                  disabled={isSubmittingReview || isDeletingReview}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
