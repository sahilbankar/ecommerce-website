import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiFolder,
  FiShoppingCart,
  FiUsers,
  FiTag,
  FiSettings,
  FiFilter,
  FiRotateCcw,
  FiAward,
  FiStar,
} from 'react-icons/fi';
import { FilterState, Category } from '../types';
import RatingComponent from './RatingComponent';

// Admin Navigation Item Definition
export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface AdminSidebarProps {
  items?: AdminNavItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const defaultAdminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <FiGrid className="h-5 w-5" /> },
  { label: 'Products', href: '/admin/products', icon: <FiBox className="h-5 w-5" /> },
  { label: 'Categories', href: '/admin/categories', icon: <FiFolder className="h-5 w-5" /> },
  { label: 'Brands', href: '/admin/brands', icon: <FiAward className="h-5 w-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <FiShoppingCart className="h-5 w-5" /> },
  { label: 'Customers', href: '/admin/customers', icon: <FiUsers className="h-5 w-5" /> },
  { label: 'Coupons', href: '/admin/coupons', icon: <FiTag className="h-5 w-5" /> },
  { label: 'Reviews', href: '/admin/reviews', icon: <FiStar className="h-5 w-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <FiSettings className="h-5 w-5" /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  items = defaultAdminNavItems,
  className = '',
}) => {
  const location = useLocation();

  return (
    <aside className={`flex flex-col w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 min-h-screen p-4 ${className}`}>
      <div className="mb-6 px-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Admin Control
        </h2>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

// Shop Filter Sidebar Component
export interface ShopFilterSidebarProps {
  categories?: Category[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  className?: string;
}

export const ShopFilterSidebar: React.FC<ShopFilterSidebarProps> = ({
  categories = [],
  filters,
  onFilterChange,
  onResetFilters,
  className = '',
}) => {
  return (
    <aside className={`w-full lg:w-64 flex flex-col gap-6 p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <FiFilter className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Filters</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
        >
          <FiRotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Categories
          </h4>
          <ul className="space-y-1 text-sm">
            <li
              onClick={() => onFilterChange({ ...filters, category: undefined })}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                !filters.category
                  ? 'bg-primary-50 text-primary-600 font-bold dark:bg-primary-950/50 dark:text-primary-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <span>All Categories</span>
            </li>
            {categories.map((cat) => {
              const isSelected = filters.category === cat.slug || filters.category === cat.id;

              return (
                <li
                  key={cat.id}
                  onClick={() => onFilterChange({ ...filters, category: cat.slug })}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-50 text-primary-600 font-bold dark:bg-primary-950/50 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.productCount !== undefined && (
                    <span className="text-xs text-gray-400">({cat.productCount})</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Price Range Filter */}
      <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Price Range (₹)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-gray-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Minimum Rating
        </h4>
        <div className="space-y-1">
          {[4, 3, 2, 1].map((stars) => {
            const isSelected = filters.rating === stars;

            return (
              <div
                key={stars}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    rating: isSelected ? undefined : stars,
                  })
                }
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/50 font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <RatingComponent value={stars} readOnly size="sm" />
                <span className="text-xs text-gray-500 dark:text-gray-400">& Up</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Filter */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onFilterChange({ ...filters, inStock: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </aside>
  );
};

export default AdminSidebar;
