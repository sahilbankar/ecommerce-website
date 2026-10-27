import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import Breadcrumb from '../components/Breadcrumb';
import { productService } from '../services';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const executeSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await productService.getProducts({ keyword: searchTerm.trim() });
      setResults(response.products);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) {
      executeSearch(initialQuery);
    }
  }, [initialQuery, executeSearch]);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams(newQuery ? { q: newQuery } : {});
    executeSearch(newQuery);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb items={[{ label: 'Search' }]} />

      <div className="max-w-xl mx-auto space-y-4 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Search Products
        </h1>
        <p className="text-xs text-gray-500">
          Find specific brand items or accessories across the catalog
        </p>
        <SearchBar
          placeholder="Search items..."
          onSearch={handleSearchSubmit}
          size="lg"
        />
      </div>

      {query.trim() && (
        <div className="space-y-6 pt-6">
          <div className="text-sm text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-3">
            Showing results for "<span className="font-bold text-gray-900 dark:text-gray-100">{query}</span>" —{' '}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {loading ? 'Searching...' : `${results.length} found`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {results.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Search Results"
              description="Check your keywords or try searching for general category terms like 'curtains', 'bedsheets', 'sofa covers', or 'lamps'."
              actionLabel="Reset Search"
              onAction={() => handleSearchSubmit('')}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
