import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiSun,
  FiMoon,
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiPackage,
} from 'react-icons/fi';
import { RootState, AppDispatch } from '../redux/store';
import { useTheme } from '../hooks/useTheme';
import { logout } from '../redux/slices/authSlice';
import SearchBar from './SearchBar';
import { shreeLogo } from '../assets';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { mode, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { totalQuantity } = useSelector((state: RootState) => state.cart);
  const wishlistItems = useSelector((state: RootState) => state.wishlist?.items || []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  const handleSearch = (query: string) => {
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-3 lg:gap-8">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
          </button>

          <Link to="/" className="flex items-center">
            <img
              src={shreeLogo}
              alt="Shree Home Decor"
              className="h-11 sm:h-12 w-36 sm:w-44 md:w-48 object-contain object-left"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Home
            </Link>
            <Link to="/shop" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Shop
            </Link>
            <Link to="/orders" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-semibold text-primary-600 dark:text-primary-400">
              Check Order
            </Link>
          </nav>
        </div>

        {/* Middle: Search Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar onSearch={handleSearch} size="sm" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {mode === 'dark' ? <FiSun className="h-5 w-5 text-amber-400" /> : <FiMoon className="h-5 w-5" />}
          </button>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Wishlist"
          >
            <FiHeart className="h-5 w-5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Cart Link with Badge */}
          <Link
            to="/cart"
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Cart"
          >
            <FiShoppingCart className="h-5 w-5" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white shadow-sm">
                {totalQuantity}
              </span>
            )}
          </Link>

          {/* User Auth Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 rounded-full p-1 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300 text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-gray-50 dark:text-primary-400 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <FiShield className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <FiPackage className="h-4 w-4" />
                      Check Order / My Orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <FiUser className="h-4 w-4" />
                      My Account
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-lg"
                    >
                      <FiLogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} size="sm" />
          </div>
          <nav className="flex flex-col gap-2 font-medium text-sm text-gray-700 dark:text-gray-300">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              Shop
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 font-semibold text-primary-600 dark:text-primary-400"
            >
              Check Order
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
