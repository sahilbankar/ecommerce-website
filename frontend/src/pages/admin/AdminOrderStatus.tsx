import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchAllOrders, updateOrderStatus, Order } from '../../redux/slices/orderSlice';
import { notifySuccess, notifyError } from '../../components/Toast';
import { formatCurrency } from '../../utils';
import { exportOrderStatusPdf } from '../../utils/pdfExport';
import {
  FiSearch, FiRefreshCw, FiAlertCircle, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiTruck, FiClock, FiPackage, FiDownload
} from 'react-icons/fi';

const ORDER_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const statusColors: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700',
  'Out for Delivery': 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  Shipped: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  Processing: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-300 dark:border-amber-700',
  Confirmed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border-red-300 dark:border-red-700',
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getUserName = (user: Order['user']): string => {
  if (typeof user === 'string') return 'Unknown';
  return user?.name || 'Customer';
};

const getUserEmail = (user: Order['user']): string => {
  if (typeof user === 'string') return '';
  return user?.email || '';
};

export const AdminOrderStatus: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: LIMIT, status: filterStatus }));
  }, [dispatch, page, filterStatus]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (order.orderStatus === newStatus) return;
    setUpdatingId(order._id);
    try {
      const result = await dispatch(updateOrderStatus({
        id: order._id,
        status: newStatus,
        trackingNumber: order.trackingNumber || ''
      }));

      if (updateOrderStatus.fulfilled.match(result)) {
        notifySuccess(`Order #${order._id.slice(-8).toUpperCase()} status changed to "${newStatus}"`);
        dispatch(fetchAllOrders({ page, limit: LIMIT, status: filterStatus }));
      } else {
        notifyError((result.payload as string) || 'Failed to update order status');
      }
    } catch {
      notifyError('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    const name = getUserName(o.user).toLowerCase();
    const email = getUserEmail(o.user).toLowerCase();
    const id = o._id.toLowerCase();
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return name.includes(q) || email.includes(q) || id.includes(q);
  });

  const statusCounts = ORDER_STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.orderStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  const handleDownloadPdf = () => {
    if (orders.length === 0) {
      notifyError('No order fulfillment data available to export');
      return;
    }
    exportOrderStatusPdf(orders);
    notifySuccess('Order status report downloaded successfully!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiTruck className="text-primary-600 dark:text-primary-400" />
            Order Status Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manually view, monitor, and update the status of customer orders. Changes reflect instantly on customer side.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FiDownload className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            Download PDF Report
          </button>
          <button
            onClick={() => dispatch(fetchAllOrders({ page, limit: LIMIT, status: filterStatus }))}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Status Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {ORDER_STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => {
              setFilterStatus(filterStatus === s ? 'All' : s);
              setPage(1);
            }}
            className={`rounded-xl border p-3 text-center transition-all ${
              filterStatus === s
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-md ring-2 ring-primary-500/20'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-400'
            }`}
          >
            <p className={`text-xl font-bold ${filterStatus === s ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
              {statusCounts[s] || 0}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{s}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders by customer name, email, or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-medium"
        >
          <option value="All">All Statuses</option>
          {ORDER_STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Orders Table with Quick Status Controls */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="h-8 w-8 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Loading orders...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3.5 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Items</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Total Amount</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Current Status</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Update Status</th>
                  <th className="px-4 py-3.5 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">
                      No orders found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => {
                    const isUpdating = updatingId === order._id;
                    return (
                      <tr key={order._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-4 font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white">{getUserName(order.user)}</p>
                          <p className="text-xs text-gray-400">{getUserEmail(order.user)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                            <FiPackage className="h-3.5 w-3.5 text-gray-500" />
                            {order.orderItems.length} items
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${statusColors[order.orderStatus] || ''}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={order.orderStatus}
                              disabled={isUpdating}
                              onChange={e => handleStatusChange(order, e.target.value)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 cursor-pointer shadow-sm hover:border-primary-500 transition-colors"
                            >
                              {ORDER_STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="h-4 w-4 rounded-full border-2 border-primary-600 border-t-transparent animate-spin flex-shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-gray-800 text-sm bg-gray-50/50 dark:bg-gray-800/30">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-bold">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={orders.length < LIMIT}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderStatus;
