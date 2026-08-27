import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../constants/dummyData';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import Breadcrumb from '../components/Breadcrumb';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams({ q: newQuery });
  };

  const results = MOCK_PRODUCTS.filter((product) => {
    if (!query.trim()) return false;
    const term = query.toLowerCase();
    return (
      product.title.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.brand?.toLowerCase().includes(term)
    );
  });

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
            <span className="font-semibold text-primary-600 dark:text-primary-400">{results.length} found</span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Search Results"
              description="Check your keywords or try searching for general category terms like 'headphones', 'watch', or 'decor'."
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
