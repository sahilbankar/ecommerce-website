import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiStar,
  FiAlertCircle,
  FiPackage,
  FiDownload,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { BackendProduct, Category } from '../../types';
import { notifySuccess, notifyError } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { formatCurrency } from '../../utils';
import { exportProductsPdf } from '../../utils/pdfExport';
import { peacockWallArtFront } from '../../assets';

const statusColors: Record<string, string> = {
  'In Stock': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Low Stock': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'Out of Stock': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

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

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(10);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<BackendProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch categories for the filter tabs
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const list = response.data?.data?.categories || [];
        setCategories(list);
      } catch {
        // Silently handle category fetch error on filter bar
      }
    };
    fetchCategories();
  }, []);

  // Fetch products from backend API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearch.trim()) {
        params.keyword = debouncedSearch.trim();
      }

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await api.get('/products', { params });
      const data = response.data?.data;
      setProducts(data?.products || []);
      if (data?.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalProducts(data.pagination.totalProducts || 0);
      }
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to fetch products from server'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Delete Confirmation
  const handleDeleteClick = (product: BackendProduct) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const productId = productToDelete._id || productToDelete.id;
    if (!productId) return;

    setIsDeleting(true);
    try {
      await api.delete(`/products/${productId}`);
      notifySuccess('Product deleted successfully');
      setDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to delete product'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to extract image URL
  const getImageUrl = (product: BackendProduct): string => {
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
      if (first && typeof first === 'object' && first.url && first.url.trim()) return first.url.trim();
    }
    return peacockWallArtFront;
  };

  // Helper to extract Category name
  const getCategoryName = (product: BackendProduct): string => {
    if (product.category && typeof product.category === 'object' && 'name' in product.category) {
      return product.category.name;
    }
    return 'Uncategorized';
  };

  // Helper to extract Brand name
  const getBrandName = (product: BackendProduct): string => {
    if (product.brand && typeof product.brand === 'object' && 'name' in product.brand) {
      return product.brand.name;
    }
    if (typeof product.brand === 'string') {
      return product.brand;
    }
    return 'Generic';
  };

  // Helper for status badge
  const getStockStatus = (stock: number): string => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  };

  // Helper for Rating display
  const getRatingValue = (product: BackendProduct): number => {
    if (typeof product.ratings === 'number') return product.ratings;
    if (product.ratings && typeof product.ratings === 'object' && 'average' in product.ratings) {
      return product.ratings.average || 0;
    }
    return 0;
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      // Fetch full catalog for complete comprehensive report
      const response = await api.get('/products', { params: { limit: 1000 } });
      const allProducts: BackendProduct[] = response.data?.data?.products || [];
      exportProductsPdf(allProducts.length > 0 ? allProducts : products);
      notifySuccess('Products report downloaded successfully!');
    } catch {
      exportProductsPdf(products);
      notifySuccess('Products report downloaded!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalProducts} total products registered in catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Download complete Products PDF Report"
          >
            <FiDownload className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            {isExporting ? 'Generating...' : 'Download PDF Report'}
          </button>
          <Link
            to="/admin/products/add"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <FiPlus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => {
              setSelectedCategory('All');
              setCurrentPage(1);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              selectedCategory === 'All'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-primary-400'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => {
            const catId = c._id || c.id || c.slug;
            const isSelected = selectedCategory === catId;
            return (
              <button
                key={catId}
                onClick={() => {
                  setSelectedCategory(catId);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-primary-400'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={7} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400">
              <FiPackage className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search || selectedCategory !== 'All'
                ? 'Try adjusting your search query or category filters to find products.'
                : 'Get started by creating your first product listing in the store.'}
            </p>
            <div className="pt-2">
              <Link
                to="/admin/products/add"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <FiPlus className="h-4 w-4" /> Add Product Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold">Rating</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {products.map((product) => {
                  const prodId = product._id || product.id || '';
                  const status = getStockStatus(product.stock);

                  return (
                    <tr
                      key={prodId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(product)}
                            alt={product.title}
                            className="h-10 w-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://placehold.co/80x80/f3f4f6/9ca3af?text=No+Image';
                            }}
                          />
                          <div className="max-w-xs">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {product.title}
                            </p>
                            <p className="text-xs text-gray-400">{getBrandName(product)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {getCategoryName(product)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        <div>
                          <span>{formatCurrency(product.price)}</span>
                          {product.discountPrice && product.discountPrice > 0 ? (
                            <span className="block text-[11px] text-emerald-600 font-normal">
                              Sale: {formatCurrency(product.discountPrice)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? 'text-red-500'
                              : product.stock < 10
                              ? 'text-amber-500'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {product.stock === 0 ? 'Out' : product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <FiStar className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {getRatingValue(product).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            statusColors[status] || statusColors['In Stock']
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/edit/${prodId}`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete Product"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalProducts > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalProducts}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        title="Delete Product"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Product
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 shrink-0">
            <FiAlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              Are you sure you want to delete this product?
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              "{productToDelete?.title}" will be permanently removed from MongoDB database and store catalog.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
