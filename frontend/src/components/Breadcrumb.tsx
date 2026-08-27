import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiChevronRight } from 'react-icons/fi';
import { BreadcrumbItem } from '../types';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHomeIcon = true,
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2 flex-wrap">
        {showHomeIcon && (
          <li className="inline-flex items-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <FiHome className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center gap-1.5 md:gap-2">
              {(showHomeIcon || index > 0) && (
                <FiChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
              )}
              {isLast || !item.href ? (
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
