import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterState, Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { ShopFilterSidebar } from '../components/Sidebar';
import Pagination from '../components/Pagination';
import Breadcrumb from '../components/Breadcrumb';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { addToCartAsync } from '../redux/slices/cartSlice';
import { notifySuccess } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import { productService, categoryService } from '../services';

export const Shop: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';
  const searchParamCategory = searchParams.get('category') || '';

  // Local filter states
  const [filters, setFilters] = useState<FilterState>({
    category: searchParamCategory || undefined,
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
    inStock: false,
    sortBy: 'default',
    searchQuery: searchParamQuery || undefined,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Real backend data state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Load real categories from backend for filter sidebar
  useEffect(() => {
    categoryService
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  // Sync searchQuery with URL param only when they actually differ
  useEffect(() => {
    const newSearch = searchParamQuery || undefined;
    const newCat = searchParamCategory || undefined;
    setFilters((prev) => {
      if (prev.searchQuery === newSearch && prev.category === newCat) {
        return prev;
      }
      setCurrentPage(1);
      return {
        ...prev,
        searchQuery: newSearch,
        category: newCat,
      };
    });
  }, [searchParamQuery, searchParamCategory]);

  // Fetch real products from backend API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let sortParam: string | undefined;
      if (filters.sortBy === 'price-low') sortParam = 'price-asc';
      else if (filters.sortBy === 'price-high') sortParam = 'price-desc';
      else if (filters.sortBy === 'rating') sortParam = 'rating';
      else if (filters.sortBy === 'newest') sortParam = 'newest';

      const response = await productService.getProducts({
        page: currentPage,
        limit: pageSize,
        keyword: filters.searchQuery,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        rating: filters.rating,
        inStock: filters.inStock,
        sort: sortParam,
      });

      setProducts(response.products);
      setTotalItems(response.totalProducts);
      setTotalPages(response.totalPages);
    } catch {
      setProducts([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);

    if (newFilters.category) {
      setSearchParams({ category: newFilters.category });
    } else {
      setSearchParams({});
    }
  };

  const handleResetFilters = () => {
    setFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      rating: undefined,
      inStock: false,
      sortBy: 'default',
      searchQuery: undefined,
    });
    setSearchParams({});
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <Breadcrumb items={[{ label: 'Shop', href: '/shop' }]} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Shop filter sidebar */}
        <div className="shrink-0">
          <ShopFilterSidebar
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Right Side: Header and items grid */}
        <div className="flex-1 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? (
                <span>Loading products...</span>
              ) : (
                <>
                  We found{' '}
                  <span className="font-bold text-gray-900 dark:text-gray-100">{totalItems}</span>{' '}
                  products match your filters.
                </>
              )}
            </div>

            <div className="flex items-center gap-2 self-end">
              <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
              <select
                value={filters.sortBy || 'default'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="default">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Average Rating</option>
                <option value="newest">Latest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Grid Output */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id || product._id}
                  product={product}
                  onAddToCart={(p) => {
                    dispatch(addToCartAsync({ product: p }));
                    notifySuccess(`Added ${p.title} to Cart!`);
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Products Found"
              description="We couldn't find any products matching your specific selection or search filters. Try loosening your price threshold or resetting query terms."
              actionLabel="Clear Filter Settings"
              onAction={handleResetFilters}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
