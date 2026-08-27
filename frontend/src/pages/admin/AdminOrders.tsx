import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchAllOrders, updateOrderStatus, Order } from '../../redux/slices/orderSlice';
import { notifySuccess, notifyError } from '../../components/Toast';
import { formatCurrency } from '../../utils';
import {
  FiSearch, FiEye, FiEdit2, FiChevronLeft, FiChevronRight,
  FiRefreshCw, FiAlertCircle, FiX
} from 'react-icons/fi';

const statusColors: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Confirmed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  'Out for Delivery': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
};

const ALL_STATUSES = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getUserName = (user: Order['user']): string => {
  if (typeof user === 'string') return 'Unknown';
  return user?.name || 'Unknown';
};

const getUserEmail = (user: Order['user']): string => {
  if (typeof user === 'string') return '';
  return user?.email || '';
};

export const AdminOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    dispatch(fetchAllOrders({ page, limit: LIMIT, status: statusFilter }));
  }, [dispatch, page, statusFilter]);

  const filtered = orders.filter(o => {
    const name = getUserName(o.user).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || o._id.toLowerCase().includes(q);
  });

  const statusCounts = ALL_STATUSES
    .filter(s => s !== 'All')
    .reduce((acc, s) => {
      acc[s] = orders.filter(o => o.orderStatus === s).length;
      return acc;
    }, {} as Record<string, number>);

  const handleOpenEdit = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setTrackingNumber(order.trackingNumber || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    const result = await dispatch(updateOrderStatus({
      id: selectedOrder._id,
      status: newStatus,
      trackingNumber,
    }));
    setIsSaving(false);
    if (updateOrderStatus.fulfilled.match(result)) {
      notifySuccess(`Order status updated to "${newStatus}"`);
      setSelectedOrder(null);
      dispatch(fetchAllOrders({ page, limit: LIMIT, status: statusFilter }));
    } else {
      notifyError((result.payload as string) || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{orders.length} orders loaded</p>
        </div>
        <button
          onClick={() => dispatch(fetchAllOrders({ page, limit: LIMIT, status: statusFilter }))}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Status Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {ALL_STATUSES.filter(s => s !== 'All').map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s === statusFilter ? 'All' : s); setPage(1); }}
            className={`rounded-xl border p-3 text-center transition-all ${
              statusFilter === s
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-violet-400'
            }`}
          >
            <p className={`text-lg font-bold ${statusFilter === s ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
              {statusCounts[s] || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{s}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <FiAlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="h-8 w-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Loading orders...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Items</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filtered.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-violet-600 dark:text-violet-400">
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{getUserName(order.user)}</p>
                        <p className="text-xs text-gray-400">{getUserEmail(order.user)}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.orderItems.length}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${order.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.orderStatus] || ''}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                            title="View Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            title="Update Status"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Showing {filtered.length} orders</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold">{page}</button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={orders.length < LIMIT}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedOrder && !newStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Order #{selectedOrder._id.slice(-8).toUpperCase()}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Customer', value: getUserName(selectedOrder.user) },
                { label: 'Email', value: getUserEmail(selectedOrder.user) },
                { label: 'Total Amount', value: formatCurrency(selectedOrder.totalPrice) },
                { label: 'Payment Method', value: selectedOrder.paymentMethod },
                { label: 'Paid', value: selectedOrder.isPaid ? 'Yes' : 'No' },
                { label: 'Order Date', value: formatDate(selectedOrder.createdAt) },
                { label: 'Tracking #', value: selectedOrder.trackingNumber || 'N/A' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{row.value}</span>
                </div>
              ))}

              {/* Delivery Information */}
              <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 block mb-1 font-semibold">Delivery Address</span>
                {selectedOrder.shippingAddress ? (
                  <p className="text-xs text-gray-800 dark:text-gray-200">
                    {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode},{' '}
                    {selectedOrder.shippingAddress.country || 'India'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No address details</p>
                )}
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">Current Order Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[selectedOrder.orderStatus] || ''}`}>
                  {selectedOrder.orderStatus}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.orderItems.map((item, idx) => (
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
                    <span className="text-xs font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleOpenEdit(selectedOrder)}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              Update Status
            </button>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {newStatus && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedOrder(null); setNewStatus(''); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Order Status</h3>
              <button onClick={() => { setSelectedOrder(null); setNewStatus(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Order: #{selectedOrder._id.slice(-8).toUpperCase()} · {getUserName(selectedOrder.user)}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tracking Number (optional)</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. TRACK123456"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
