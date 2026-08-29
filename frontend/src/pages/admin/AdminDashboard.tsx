import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiArrowRight,
  FiShoppingCart,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiTag,
  FiMessageSquare
} from 'react-icons/fi';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils';

const statusColors: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

const barLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const AdminDashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const t = new Date().getTime(); // Prevent caching
        const statsRes = await api.get(`/admin/stats?t=${t}`);
        setDashboardData(statsRes.data.data);

        const ordersRes = await api.get(`/admin/recent-orders?limit=5&t=${t}`);
        setRecentOrders(ordersRes.data.data.orders);

        const reviewsRes = await api.get(`/reviews/all?limit=3&t=${t}`);
        setRecentReviews(reviewsRes.data.data.reviews || []);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchDashboard();

    // Poll for real-time updates every 3 seconds
    const interval = setInterval(fetchDashboard, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { summary, monthlyRevenue, topProducts } = dashboardData;

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue || 0),
      icon: ({ className }: { className?: string }) => <span className={`text-xl font-bold font-sans flex items-center justify-center ${className || ''}`}>₹</span>,
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      text: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Total Orders',
      value: summary.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Customers',
      value: summary.totalUsers || 0,
      icon: FiUsers,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Total Products',
      value: summary.totalProducts || 0,
      icon: FiPackage,
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'Delivered Orders',
      value: summary.deliveredOrders || 0,
      icon: FiCheckCircle,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Cancelled Orders',
      value: summary.cancelledOrders || 0,
      icon: FiXCircle,
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Total Coupons',
      value: summary.totalCoupons || 0,
      icon: FiTag,
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Total Reviews',
      value: summary.totalReviews || 0,
      icon: FiMessageSquare,
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      text: 'text-pink-600 dark:text-pink-400',
    }
  ];

  // Process monthly revenue data to fit a 12 month array
  const barData = new Array(12).fill(0);
  monthlyRevenue.forEach((m: any) => {
    barData[m._id.month - 1] = m.revenue;
  });
  const maxBar = Math.max(...barData, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, Admin! 👋</h2>
            <p className="mt-1 text-violet-200 text-sm">Here's what's happening in your store today.</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors"
          >
            View All Orders <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Monthly revenue</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {barData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-purple-400 opacity-80 group-hover:opacity-100 transition-all duration-300 relative"
                  style={{ height: `${(val / maxBar) * 100}%` }}
                  title={formatCurrency(val)}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {formatCurrency(val)}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 dark:text-gray-500">{barLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Top Products</h3>
            <Link to="/admin/products" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No product data available</p>
            ) : (
              topProducts.map((p: any, i: number) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.totalSold} sold · {formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders + Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">#{order._id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.user?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.orderStatus] || statusColors.Pending}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Reviews</h3>
            <Link to="/admin/reviews" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No reviews found</p>
            ) : (
              recentReviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.user?.name || 'Anonymous User'}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <FiStar key={j} className={`h-3 w-3 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1 line-clamp-1">{r.product?.title || 'Unknown Product'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
