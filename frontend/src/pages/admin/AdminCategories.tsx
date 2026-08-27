import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiFolder,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { BackendCategory } from '../../types';
import { notifySuccess, notifyError } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import Button from '../../components/Button';
import { TableSkeleton } from '../../components/SkeletonLoader';

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

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form Modal State (for Add & Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BackendCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BackendCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Categories from Backend (View / Display)
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      const data = response.data?.data?.categories || [];
      setCategories(data);
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: BackendCategory) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setFormModalOpen(true);
  };

  // Auto-generate slug as name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  // Handle Add / Edit Submission (Insert & Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notifyError('Category name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: description.trim(),
    };

    setIsSubmitting(true);
    try {
      const categoryId = editingCategory?._id || editingCategory?.id;

      if (editingCategory && categoryId) {
        // Edit / Update Category
        await api.put(`/categories/${categoryId}`, payload);
        notifySuccess('Category updated successfully');
      } else {
        // Add / Insert Category
        await api.post('/categories', payload);
        notifySuccess('Category created successfully');
      }

      setFormModalOpen(false);
      fetchCategories();
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, editingCategory ? 'Failed to update category' : 'Failed to create category'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleDeleteClick = (cat: BackendCategory) => {
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete._id || categoryToDelete.id;
    if (!catId) return;

    setIsDeleting(true);
    try {
      await api.delete(`/categories/${catId}`);
      notifySuccess('Category deleted successfully');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to delete category'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Search filter
  const filteredCategories = categories.filter((cat) => {
    const q = search.toLowerCase();
    const nameMatch = cat.name?.toLowerCase().includes(q);
    const slugMatch = cat.slug?.toLowerCase().includes(q);
    const descMatch = cat.description?.toLowerCase().includes(q);
    return nameMatch || slugMatch || descMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage product categories in your store
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          leftIcon={<FiPlus className="h-4 w-4" />}
        >
          Add Category
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories by name..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* View / Display Categories Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={3} />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400">
              <FiFolder className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No categories found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search
                ? 'No categories match your search query.'
                : 'Get started by clicking Add Category.'}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddModal}
                leftIcon={<FiPlus className="h-4 w-4" />}
              >
                Add Category
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3.5 text-left font-semibold">Category Name</th>
                <th className="px-6 py-3.5 text-left font-semibold">Slug</th>
                <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCategories.map((cat) => {
                const catId = cat._id || cat.id || '';
                return (
                  <tr
                    key={catId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                          <FiFolder className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      /{cat.slug}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                          title="Edit Category"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(cat)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Delete Category"
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
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        subtitle={
          editingCategory
            ? 'Update category name and details'
            : 'Enter the category name to create a new category'
        }
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Electronics, Clothing, Footwear"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Category Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="electronics"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<FiCheckCircle className="h-4 w-4" />}
            >
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-2xl">
              <FiAlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Delete this category?
              </p>
              <p className="text-xs text-gray-500">
                Category: <span className="font-semibold text-gray-900 dark:text-white">{categoryToDelete?.name}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            This will permanently remove the category from your database. Deletion will be rejected if products are currently using this category.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCategories;
