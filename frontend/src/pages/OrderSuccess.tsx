import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheckCircle, FiArrowRight, FiShoppingBag, FiPackage, FiXCircle } from 'react-icons/fi';
import Button from '../components/Button';
import { AppDispatch, RootState } from '../redux/store';
import { fetchOrderById, cancelOrderAsync, Order } from '../redux/slices/orderSlice';
import { formatCurrency } from '../utils';
import { notifySuccess, notifyError } from '../components/Toast';

export const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  // Order passed directly from Checkout via navigation state
  const stateOrder = location.state?.order;
  const { currentOrder, isLoading } = useSelector((state: RootState) => state.orders);
  const user = useSelector((state: RootState) => state.auth.user);

  const [localOrder, setLocalOrder] = useState<Order | null>(stateOrder || null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // If we have an ID in the URL query params, fetch from API
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId && !stateOrder) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, location.search, stateOrder]);

  useEffect(() => {
    if (!stateOrder && currentOrder) {
      setLocalOrder(currentOrder);
    }
  }, [currentOrder, stateOrder]);

  const order = localOrder || stateOrder || currentOrder;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getEstimatedDelivery = (createdAt: string) => {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    const result = await dispatch(cancelOrderAsync(order._id));
    setIsCancelling(false);
    setConfirmCancel(false);
    if (cancelOrderAsync.fulfilled.match(result)) {
      notifySuccess('Order cancelled successfully.');
      setLocalOrder(result.payload);
    } else {
      notifyError((result.payload as string) || 'Failed to cancel order.');
    }
  };

  const canCancel = (ord: Order | null) => {
    if (!ord) return false;
    return !['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(ord.orderStatus);
  };

  const shortId = order ? '#' + order._id.slice(-8).toUpperCase() : '';

  return (
    <div className="mx-auto max-w-lg text-center py-16 px-4 space-y-6">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-400 mb-4 animate-bounce">
        <FiCheckCircle className="h-12 w-12" />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
        Order Confirmed!
      </h1>
      <p className="text-sm text-gray-500">
        Thank you for shopping with us. Your order has been received and is being processed.
      </p>

      {isLoading && !order && (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        </div>
      )}

      {order && (
        <>
          {order.isPaid && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 text-emerald-800 dark:text-emerald-300 font-bold text-sm shadow-sm">
              <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Online Payment Successful</span>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Order ID</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">{shortId}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Order Status</span>
              <span className={`font-bold ${
                order.orderStatus === 'Cancelled'
                  ? 'text-red-500'
                  : order.orderStatus === 'Confirmed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-primary-600 dark:text-primary-400'
              }`}>
                {order.orderStatus}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Payment Status</span>
              <span className={`font-bold ${order.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {order.isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
            {order.cancellationReason && (
              <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
                <span className="text-gray-400">Cancellation Reason</span>
                <span className="font-bold text-red-600 dark:text-red-400">{order.cancellationReason}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Order Date</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Total Paid</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Payment Method</span>
              <span className="font-bold text-gray-900 dark:text-white">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Estimated Delivery</span>
              <span className="font-bold text-gray-900 dark:text-white">{getEstimatedDelivery(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Confirmation sent to</span>
              <span className="font-bold text-gray-900 dark:text-white">{user?.email || 'your email'}</span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              <FiPackage className="inline mr-1.5" />Items Ordered ({order.orderItems.length})
            </h3>
            <div className="space-y-3">
              {order.orderItems.map((item: import('../redux/slices/orderSlice').OrderItem, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-10 w-10 rounded-lg object-cover border border-gray-100 dark:border-gray-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} · {formatCurrency(item.price)}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!order && !isLoading && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Delivery</span>
            <span className="font-bold text-gray-900 dark:text-white">In 3-5 Business Days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Confirmation sent to</span>
            <span className="font-bold text-gray-900 dark:text-white">{user?.email || 'your email'}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4">
        {order && canCancel(order) && (
          <>
            {confirmCancel ? (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Cancel this order?</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmCancel(false)}
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="!bg-red-600 hover:!bg-red-700 border-red-600 text-white font-bold"
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                fullWidth
                variant="outline"
                onClick={() => setConfirmCancel(true)}
                leftIcon={<FiXCircle className="h-4 w-4 text-red-500" />}
                className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-900 dark:!text-red-400 font-bold"
              >
                Cancel Order
              </Button>
            )}
          </>
        )}

        <Button
          fullWidth
          onClick={() => navigate('/orders')}
          leftIcon={<FiShoppingBag className="h-4 w-4" />}
        >
          Track My Orders
        </Button>
        <Button
          fullWidth
          variant="outline"
          onClick={() => navigate('/shop')}
          rightIcon={<FiArrowRight className="h-4 w-4" />}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
