import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiArrowRight,
  FiShoppingCart,
  FiStar,
} from 'react-icons/fi';

const stats = [
  {
    label: 'Total Revenue',
    value: '₹48,295',
    change: '+12.5%',
    up: true,
    icon: FiDollarSign,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Total Orders',
    value: '1,284',
    change: '+8.2%',
    up: true,
    icon: FiShoppingCart,
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Total Customers',
    value: '3,741',
    change: '+5.1%',
    up: true,
    icon: FiUsers,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Total Products',
    value: '896',
    change: '-2.4%',
    up: false,
    icon: FiPackage,
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
];

const recentOrders = [
  { id: '#ORD-7821', customer: 'Alice Johnson', product: 'Nike Air Max 270', amount: '₹1,299.00', status: 'Delivered', date: 'Jul 24, 2026' },
  { id: '#ORD-7820', customer: 'Bob Smith', product: 'Sony WH-1000XM5', amount: '₹3,490.00', status: 'Processing', date: 'Jul 24, 2026' },
  { id: '#ORD-7819', customer: 'Carol White', product: 'Apple AirPods Pro', amount: '₹2,490.00', status: 'Shipped', date: 'Jul 23, 2026' },
  { id: '#ORD-7818', customer: 'David Brown', product: 'Samsung Galaxy S24', amount: '₹7,990.00', status: 'Pending', date: 'Jul 23, 2026' },
  { id: '#ORD-7817', customer: 'Eva Martinez', product: 'MacBook Air M3', amount: '₹12,990.00', status: 'Delivered', date: 'Jul 22, 2026' },
];

const topProducts = [
  { name: 'MacBook Air M3', sales: 142, revenue: '₹1,84,458', rating: 4.9 },
  { name: 'Sony WH-1000XM5', sales: 238, revenue: '₹83,062', rating: 4.8 },
  { name: 'Nike Air Max 270', sales: 319, revenue: '₹41,471', rating: 4.7 },
  { name: 'Apple AirPods Pro', sales: 205, revenue: '₹51,045', rating: 4.8 },
  { name: 'Samsung Galaxy S24', sales: 176, revenue: '₹1,40,624', rating: 4.6 },
];

const recentReviews = [
  { user: 'Alice J.', product: 'MacBook Air M3', rating: 5, comment: 'Absolutely love it! Super fast and lightweight.' },
  { user: 'Bob S.', product: 'Sony WH-1000XM5', rating: 4, comment: 'Great noise cancellation, comfortable for long use.' },
  { user: 'Carol W.', product: 'Nike Air Max 270', rating: 5, comment: 'Very comfortable for all-day wear.' },
];

const statusColors: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  Processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  Shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

const barData = [65, 40, 85, 55, 72, 90, 48, 60, 75, 88, 70, 95];
const barLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const AdminDashboardPage: React.FC = () => {
  const maxBar = Math.max(...barData);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
              <div className="mt-4 flex items-center gap-1">
                {stat.up ? (
                  <FiTrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <FiTrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${stat.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">vs last month</span>
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Monthly revenue for 2026</p>
            </div>
            <span className="text-xs bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-3 py-1 rounded-full font-medium">2026</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {barData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-purple-400 opacity-80 group-hover:opacity-100 transition-all duration-300 relative"
                  style={{ height: `${(val / maxBar) * 100}%` }}
                  title={`₹${val}k`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    ₹{val}k
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
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.sales} sold · {p.revenue}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <FiStar className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{p.rating}</span>
                </div>
              </div>
            ))}
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
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-violet-600 dark:text-violet-400">{order.id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.customer}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{order.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{order.date}</td>
                  </tr>
                ))}
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
            {recentReviews.map((r, i) => (
              <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.user}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <FiStar key={j} className={`h-3 w-3 ${j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">{r.product}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
