import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiLock,
  FiUnlock,
  FiClock,
  FiShoppingBag,
  FiUserPlus,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { notifySuccess, notifyError } from '../../components/Toast';
import { formatCurrency } from '../../utils';

interface CustomerActivity {
  type: 'REGISTER' | 'LOGIN' | 'ORDER';
  title: string;
  description: string;
  timestamp: string;
}

interface CustomerOrder {
  _id: string;
  totalPrice: number;
  orderStatus: string;
  createdAt: string;
  orderItems?: { title: string; quantity: number }[];
}

interface CustomerUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  avatar?: { url?: string; public_id?: string } | string;
  isBlocked?: boolean;
  lastLogin?: string;
  createdAt: string;
  ordersCount?: number;
  totalOrders?: number;
  totalSpent?: number;
  activities?: CustomerActivity[];
  recentOrders?: CustomerOrder[];
}

const avatarColors = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const responseData = error.response.data as { message?: string; errors?: string[] };
    return (
      responseData.message ||
      (Array.isArray(responseData.errors) ? responseData.errors.join(', ') : null) ||
      error.message ||
      fallback
    );
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'customer' | 'admin'>('All');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Customer Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailedCustomer, setDetailedCustomer] = useState<CustomerUser | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Fetch Customers from Backend API
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: 50,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'Active') params.isBlocked = false;
      if (statusFilter === 'Blocked') params.isBlocked = true;
      if (roleFilter !== 'All') params.role = roleFilter;

      const res = await api.get('/users', { params });
      const data = res.data?.data;
      const userList: CustomerUser[] = data?.users || [];
      const pagination = data?.pagination;

      setCustomers(userList);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
      }
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to fetch customer users from database'));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch single customer details & activity timeline
  const openCustomerDetails = async (userId: string) => {
    setSelectedCustomerId(userId);
    setIsLoadingDetails(true);
    try {
      const res = await api.get(`/users/${userId}`);
      const userData: CustomerUser = res.data?.data?.user;
      setDetailedCustomer(userData);
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to load customer details'));
      setSelectedCustomerId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Toggle user block / unblock status
  const handleToggleBlock = async (user: CustomerUser) => {
    if (user.role === 'admin') {
      notifyError('Admin accounts cannot be suspended');
      return;
    }

    const newBlockedState = !user.isBlocked;
    setStatusUpdatingId(user._id);

    try {
      await api.put(`/users/${user._id}/status`, { isBlocked: newBlockedState });
      notifySuccess(`Customer account ${newBlockedState ? 'suspended' : 'activated'} successfully`);

      // Update local customers list
      setCustomers((prev) =>
        prev.map((c) => (c._id === user._id ? { ...c, isBlocked: newBlockedState } : c))
      );

      if (detailedCustomer && detailedCustomer._id === user._id) {
        setDetailedCustomer((prev) => (prev ? { ...prev, isBlocked: newBlockedState } : null));
      }
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to update customer status'));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Compute Summary Statistics
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => !c.isBlocked).length;
  const blockedCount = customers.filter((c) => c.isBlocked).length;
  const totalOrdersCount = customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
  const avgOrders = totalCount > 0 ? Math.round(totalOrdersCount / totalCount) : 0;

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'N/A'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'N/A'
      : d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Customer Directory & Activity Log
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Real registered customers stored in MongoDB with active session logs
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Registered Customers',
            value: totalCount,
            icon: '👥',
            color: 'text-violet-600 dark:text-violet-400',
          },
          {
            label: 'Active Users',
            value: activeCount,
            icon: '✅',
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Suspended Users',
            value: blockedCount,
            icon: '⛔',
            color: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Avg. Orders / Customer',
            value: avgOrders,
            icon: '📦',
            color: 'text-blue-600 dark:text-blue-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{s.icon}</span>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <span className="text-xs text-gray-400 font-semibold">Status:</span>
          {(['All', 'Active', 'Blocked'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                statusFilter === st
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-400'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-xs text-gray-400 font-semibold ml-2">Role:</span>
          {(['All', 'customer', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors capitalize ${
                roleFilter === r
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-blue-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
            <p className="text-base font-semibold">No Registered Customers Found</p>
            <p className="text-xs">
              When users register or log in on the storefront, their live account records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3.5 font-bold">Customer Profile</th>
                  <th className="px-4 py-3.5 font-bold text-center">Orders</th>
                  <th className="px-4 py-3.5 font-bold">Total Spent</th>
                  <th className="px-4 py-3.5 font-bold">Last Login</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Joined</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {customers.map((customer, idx) => {
                  const avatarUrl =
                    typeof customer.avatar === 'object' && customer.avatar?.url
                      ? customer.avatar.url
                      : typeof customer.avatar === 'string'
                      ? customer.avatar
                      : null;

                  const initial = customer.name ? customer.name.charAt(0).toUpperCase() : 'U';
                  const avatarColor = avatarColors[idx % avatarColors.length];

                  return (
                    <tr
                      key={customer._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={customer.name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                          ) : (
                            <div
                              className={`h-10 w-10 rounded-full ${avatarColor} text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-sm`}
                            >
                              {initial}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {customer.name}
                              </p>
                              {customer.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-400">
                                  <FiShield className="h-2.5 w-2.5" /> ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                        {customer.ordersCount || 0}
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">
                        {formatCurrency(customer.totalSpent || 0)}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatActivityTime(customer.lastLogin || customer.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            customer.isBlocked
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                          }`}
                        >
                          {customer.isBlocked ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatJoinedDate(customer.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openCustomerDetails(customer._id)}
                            className="p-2 rounded-xl text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors border border-transparent hover:border-violet-200"
                            title="View Full Activity & Details"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>

                          {customer.role !== 'admin' && (
                            <button
                              disabled={statusUpdatingId === customer._id}
                              onClick={() => handleToggleBlock(customer)}
                              className={`p-2 rounded-xl transition-colors border border-transparent ${
                                customer.isBlocked
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-200'
                                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200'
                              }`}
                              title={customer.isBlocked ? 'Unblock / Activate User' : 'Suspend Customer Account'}
                            >
                              {customer.isBlocked ? (
                                <FiUnlock className="h-4 w-4" />
                              ) : (
                                <FiLock className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 text-sm">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold">
                {page}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail & Activity Timeline Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setSelectedCustomerId(null);
              setDetailedCustomer(null);
            }}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              {isLoadingDetails || !detailedCustomer ? (
                <div className="space-y-2 animate-pulse w-full">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-violet-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {detailedCustomer.name ? detailedCustomer.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                        {detailedCustomer.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          detailedCustomer.isBlocked
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {detailedCustomer.isBlocked ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {detailedCustomer.email} • ID: {detailedCustomer._id}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setDetailedCustomer(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {detailedCustomer && !isLoadingDetails && (
              <>
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Orders', value: detailedCustomer.totalOrders || 0, icon: <FiShoppingBag className="text-blue-500" /> },
                    { label: 'Total Spent', value: formatCurrency(detailedCustomer.totalSpent || 0), icon: '💰' },
                    { label: 'Registered On', value: formatJoinedDate(detailedCustomer.createdAt), icon: <FiUserPlus className="text-emerald-500" /> },
                    { label: 'Last Active', value: formatJoinedDate(detailedCustomer.lastLogin), icon: <FiClock className="text-violet-500" /> },
                  ].map((row) => (
                    <div key={row.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-center gap-1 text-sm mb-1">
                        {row.icon}
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{row.label}</span>
                      </div>
                      <p className="font-extrabold text-gray-900 dark:text-white text-sm">{row.value}</p>
                    </div>
                  ))}
                </div>

                {/* Activity Log & History Timeline */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FiClock className="text-violet-500" /> Customer Activity Log
                  </h4>

                  <div className="space-y-3 border-l-2 border-violet-100 dark:border-gray-800 pl-4 ml-2">
                    {detailedCustomer.activities && detailedCustomer.activities.length > 0 ? (
                      detailedCustomer.activities.map((act, i) => (
                        <div key={i} className="relative group">
                          <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full bg-violet-600 ring-4 ring-white dark:ring-gray-900" />
                          <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">
                                {act.title}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatActivityTime(act.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No activity recorded for this customer yet.</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                  {detailedCustomer.role !== 'admin' && (
                    <button
                      disabled={statusUpdatingId === detailedCustomer._id}
                      onClick={() => handleToggleBlock(detailedCustomer)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                        detailedCustomer.isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                      }`}
                    >
                      {detailedCustomer.isBlocked ? 'Activate Customer Account' : 'Suspend Customer Account'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setDetailedCustomer(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
