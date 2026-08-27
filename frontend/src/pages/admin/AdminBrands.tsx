import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiTag,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { notifySuccess, notifyError } from '../../components/Toast';
import { Modal } from '../../components/Modal';
import Button from '../../components/Button';
import { TableSkeleton } from '../../components/SkeletonLoader';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface BackendBrand {
  _id: string;
  name: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const d = error.response.data as { message?: string; errors?: string[] };
    return (
      d.message ||
      (Array.isArray(d.errors) ? d.errors.join(', ') : null) ||
      error.message ||
      fallback
    );
  } else if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const AdminBrands: React.FC = () => {
  // List state
  const [brands, setBrands] = useState<BackendBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form modal (Add / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BackendBrand | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BackendBrand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/brands');
      const data = response.data?.data?.brands || [];
      setBrands(data);
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to load brands'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // â”€â”€ Form Modal Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openAddModal = () => {
    setEditingBrand(null);
    setName('');
    setWebsite('');
    setIsActive(true);
    setFormModalOpen(true);
  };

  const openEditModal = (brand: BackendBrand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setWebsite(brand.website || '');
    setIsActive(brand.isActive);
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setFormModalOpen(false);
    setEditingBrand(null);
  };

  // â”€â”€ Add / Edit Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notifyError('Brand name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { name: name.trim(), website: website.trim(), isActive };

      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, payload);
        notifySuccess('Brand updated successfully');
      } else {
        await api.post('/brands', payload);
        notifySuccess('Brand created successfully');
      }

      setFormModalOpen(false);
      fetchBrands();
    } catch (error: unknown) {
      notifyError(
        getErrorMessage(error, editingBrand ? 'Failed to update brand' : 'Failed to create brand')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const openDeleteModal = (brand: BackendBrand) => {
    setBrandToDelete(brand);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setBrandToDelete(null);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/brands/${brandToDelete._id}`);
      notifySuccess('Brand deleted successfully');
      setDeleteModalOpen(false);
      setBrandToDelete(null);
      fetchBrands();
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to delete brand'));
    } finally {
      setIsDeleting(false);
    }
  };

  // â”€â”€ Filtered list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.website || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeBrandsCount = brands.filter((b) => b.isActive).length;
  const inactiveBrandsCount = brands.length - activeBrandsCount;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-5 animate-fade-in">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Brands</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? 'Loadingâ€¦' : `${brands.length} brand${brands.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
        >
          <FiPlus className="h-4 w-4" /> Add Brand
        </button>
      </div>

      {/* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Brands', value: brands.length, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Active', value: activeBrandsCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Inactive', value: inactiveBrandsCount, color: 'text-red-600 dark:text-red-400' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center shadow-sm"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? 'â€”' : s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* â”€â”€ Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search brands by name or websiteâ€¦"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Brand Name</th>
                <th className="px-4 py-3 text-left font-semibold">Website</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4}>
                    <TableSkeleton rows={5} cols={4} />
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    <FiTag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">
                      {search ? 'No brands match your search' : 'No brands found'}
                    </p>
                    {!search && (
                      <p className="text-xs mt-1">Click "Add Brand" to get started</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr
                    key={brand._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    {/* Brand Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                          <FiTag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {brand.name}
                        </span>
                      </div>
                    </td>

                    {/* Website */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {brand.website ? (
                        <span className="text-sm">{brand.website}</span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">â€”</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          brand.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(brand)}
                          title="Edit brand"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(brand)}
                          title="Delete brand"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Add / Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal
        isOpen={formModalOpen}
        onClose={closeFormModal}
        title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Puma"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Website <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. puma.com"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
            />
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              disabled={isSubmitting}
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                isActive ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
              } disabled:opacity-60`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {isSubmitting
                ? editingBrand ? 'Updatingâ€¦' : 'Addingâ€¦'
                : editingBrand ? 'Update Brand' : 'Add Brand'}
            </Button>
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* â”€â”€ Delete Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete Brand"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete brand{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{brandToDelete?.name}"
            </span>
            ? This action cannot be undone.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
            âš  Brands associated with existing products cannot be deleted.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {isDeleting ? 'Deletingâ€¦' : 'Yes, Delete'}
            </button>
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AdminBrands;
