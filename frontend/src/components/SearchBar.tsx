import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export interface SearchSuggestion {
  id: string;
  title: string;
  category?: string;
  slug?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search products, brands, categories...',
  onSearch,
  onSelectSuggestion,
  suggestions = [],
  isLoading = false,
  className = '',
  size = 'md',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    if (onSearch) onSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
      setIsOpen(false);
    }
  };

  const sizeClasses = {
    sm: 'py-1.5 pl-9 pr-8 text-xs',
    md: 'py-2 pl-10 pr-9 text-sm',
    lg: 'py-3 pl-12 pr-10 text-base',
  };

  const iconSizes = {
    sm: 'h-4 w-4 left-2.5',
    md: 'h-5 w-5 left-3',
    lg: 'h-6 w-6 left-3.5',
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <FiSearch className={`absolute text-gray-400 pointer-events-none ${iconSizes[size]}`} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-900 dark:focus:ring-primary-900/50 ${sizeClasses[size]}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    if (onSelectSuggestion) onSelectSuggestion(item);
                    setQuery(item.title);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </span>
                  {item.category && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      in {item.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
