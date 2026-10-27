import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { useTheme } from '../hooks/useTheme';
import { logout } from '../redux/slices/authSlice';
import {
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiHome,
  FiLogOut,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { AdminSidebar } from '../components/Sidebar';
import { ToasterContainer } from '../components/Toast';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { mode, toggleTheme } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path === '/admin/products/add') return 'Add New Product';
    if (path.startsWith('/admin/products/edit')) return 'Edit Product';
    if (path.startsWith('/admin/products')) return 'Product Catalog';
    if (path.startsWith('/admin/categories')) return 'Categories Management';
    if (path.startsWith('/admin/brands')) return 'Brands Management';
    if (path.startsWith('/admin/order-status')) return 'Order Status Management';
    if (path.startsWith('/admin/orders')) return 'Order Fulfillment';
    if (path.startsWith('/admin/customers')) return 'Customer Accounts';
    if (path.startsWith('/admin/coupons')) return 'Discount Coupons';
    if (path.startsWith('/admin/reviews')) return 'Reviews & Ratings';
    if (path.startsWith('/admin/settings')) return 'Global Settings';
    return 'Admin Management';
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <ToasterContainer />

      {/* Desktop Sidebar (Left) */}
      <div
        className={`hidden lg:flex flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          {!isSidebarCollapsed && (
            <Link
              to="/admin"
              className="text-base font-extrabold tracking-tight text-primary-600 dark:text-primary-400"
            >
              🛡️ ADMIN PORTAL
            </Link>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <AdminSidebar
          className="border-r-0 p-3 flex-1 overflow-y-auto"
          items={
            isSidebarCollapsed
              ? [
                  { label: '', href: '/admin', icon: <FiHome title="Dashboard" /> },
                  { label: '', href: '/admin/products', icon: <FiChevronRight title="Products" /> },
                ]
              : undefined
          }
        />

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Go to Storefront"
          >
            <FiHome className="h-5 w-5 shrink-0" />
            {!isSidebarCollapsed && <span>View Store</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Sign Out"
          >
            <FiLogOut className="h-5 w-5 shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer (Toggled via menu button) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative flex w-64 max-w-xs flex-col bg-white p-4 dark:bg-gray-900 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
              <span className="font-extrabold text-primary-600 dark:text-primary-400">🛡️ ADMIN PORTAL</span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar className="border-r-0 p-0 flex-grow" />
            <div className="mt-auto border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiHome className="h-5 w-5" />
                <span>View Store</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <FiLogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Mobile hamburger & title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Open navigation menu"
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle Theme"
            >
              {mode === 'dark' ? <FiSun className="h-5 w-5 text-amber-400" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 font-bold text-primary-700 flex items-center justify-center text-xs dark:bg-primary-950 dark:text-primary-300">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900 z-30">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'admin@eshop.com'}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <FiUser className="h-4 w-4" />
                    Admin Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-lg"
                  >
                    <FiLogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Inner Main Dashboard Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-grow overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
