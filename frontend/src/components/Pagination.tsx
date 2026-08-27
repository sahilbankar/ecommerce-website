import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show before and after current page

    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      pages.push(1, '...');
    } else {
      pages.push(1);
    }

    pages.push(...range);

    if (currentPage + delta < totalPages - 1) {
      pages.push('...', totalPages);
    } else if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}
    >
      {/* Items Summary */}
      {totalItems !== undefined && pageSize !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Page Size Selector */}
        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Previous Page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white font-bold shadow-sm dark:bg-primary-600'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Next Page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
