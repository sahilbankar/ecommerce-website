import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheckCircle, FiArrowRight, FiShoppingBag, FiPackage } from 'react-icons/fi';
import Button from '../components/Button';
import { AppDispatch, RootState } from '../redux/store';
import { fetchOrderById } from '../redux/slices/orderSlice';
import { formatCurrency } from '../utils';

export const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  // Order passed directly from Checkout via navigation state
  const stateOrder = location.state?.order;
  const { currentOrder, isLoading } = useSelector((state: RootState) => state.orders);
  const user = useSelector((state: RootState) => state.auth.user);

  // If we have an ID in the URL query params, fetch from API
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId && !stateOrder) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, location.search, stateOrder]);

  const order = stateOrder || currentOrder;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getEstimatedDelivery = (createdAt: string) => {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 5);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-gray-50 dark:border-gray-800/40 pb-2">
              <span className="text-gray-400">Order ID</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">{shortId}</span>
            </div>
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
