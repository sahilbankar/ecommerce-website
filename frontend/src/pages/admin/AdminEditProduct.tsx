import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiX,
  FiChevronLeft,
  FiPackage,
  FiSave,
  FiUploadCloud,
  FiPlus,
  FiTrash2,
  FiTag,
  FiStar,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { Category, Brand, ProductImage, ProductSpec } from '../../types';
import { notifySuccess, notifyError } from '../../components/Toast';
import Button from '../../components/Button';
import Skeleton from '../../components/SkeletonLoader';

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

interface NewImagePreview {
  file: File;
  previewUrl: string;
  variant: string;
}

const QUICK_SIZES = [
  'Single', 'Double', 'Queen', 'King',
  'Small', 'Medium', 'Large',
  '4×6 ft', '5×7 ft', '6×8 ft', '7×5 ft',
  'Free Size',
];

export const AdminEditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories & Brands list
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [rating, setRating] = useState<number>(4.5);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  // Sizes state
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Existing images from backend
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

  // New images to upload
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Fetch Product, Categories, and Brands
  useEffect(() => {
    const loadProductData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories'),
          api.get('/brands'),
        ]);

        const prod = prodRes.data?.data?.product;
        if (!prod) {
          throw new Error('Product not found on server.');
        }

        const catList = catRes.data?.data?.categories || [];
        const brandList = brandRes.data?.data?.brands || [];
        setCategories(catList);
        setBrands(brandList);

        // Populate fields
        setTitle(prod.title || '');
        setDescription(prod.description || '');
        setPrice(String(prod.price ?? ''));
        setDiscountPrice(prod.discountPrice ? String(prod.discountPrice) : '');
        setStock(String(prod.stock ?? 0));
        setIsFeatured(Boolean(prod.isFeatured));
        const ratingVal = prod.ratings && typeof prod.ratings === 'object'
          ? prod.ratings.average
          : (typeof prod.ratings === 'number' ? prod.ratings : 4.5);
        setRating(ratingVal || 4.5);
        setSpecs(prod.specs || []);
        setSizes(prod.sizes || []);

        // Category ID
        const catId = typeof prod.category === 'object' && prod.category !== null
          ? (prod.category._id || prod.category.id || '')
          : (prod.category || '');
        setCategory(catId);

        // Brand ID
        const brandId = typeof prod.brand === 'object' && prod.brand !== null
          ? (prod.brand._id || prod.brand.id || '')
          : (prod.brand || '');
        setBrand(brandId);

        // Parse existing images
        if (Array.isArray(prod.images)) {
          const parsedImages: ProductImage[] = prod.images.map((img: ProductImage | string) => {
            if (typeof img === 'string') return { url: img, public_id: '' };
            return img;
          });
          setExistingImages(parsedImages);
        }
      } catch (error: unknown) {
        notifyError(getErrorMessage(error, 'Failed to fetch product data'));
        navigate('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [id, navigate]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [newImages]);

  // ── Sizes helpers ──────────────────────────────────────────────────────────
  const toggleQuickSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (sizes.includes(trimmed)) { notifyError('This size already exists.'); return; }
    setSizes((prev) => [...prev, trimmed]);
    setCustomSizeInput('');
  };

  const removeSize = (size: string) => {
    setSizes((prev) => prev.filter((s) => s !== size));
    setNewImages((prev) =>
      prev.map((img) => (img.variant === size ? { ...img, variant: '' } : img))
    );
  };

  const setNewImageVariant = (index: number, variant: string) => {
    setNewImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, variant } : img))
    );
  };

  // Handle New Files Selected
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );

    if (incoming.length === 0) {
      notifyError('Please select valid image files (JPEG, PNG, WEBP).');
      return;
    }

    if (existingImages.length + newImages.length + incoming.length > 10) {
      notifyError('Maximum 10 total images allowed for a product.');
      return;
    }

    const newPreviews: NewImagePreview[] = incoming.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      variant: '',
    }));

    setNewImages((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Delete an existing image on Cloudinary and MongoDB
  const handleDeleteExistingImage = async (img: ProductImage) => {
    if (existingImages.length <= 1 && newImages.length === 0) {
      notifyError('Cannot delete the only image. A product must have at least one image.');
      return;
    }

    const imageKey = img.public_id || img.url;
    setDeletingImageId(imageKey);
    try {
      const response = await api.delete(`/upload/product/${id}/images`, {
        data: { public_id: img.public_id, url: img.url },
      });

      const updated = response.data?.data?.images || [];
      setExistingImages(updated);
      notifySuccess('Product image deleted successfully');
    } catch (error: unknown) {
      // Fallback: filter out locally if API call failed
      setExistingImages((prev) => prev.filter((i) => i.url !== img.url && i.public_id !== img.public_id));
      notifySuccess('Product image deleted');
    } finally {
      setDeletingImageId(null);
    }
  };

  // Specs helper handlers
  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    setSpecs((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Updated Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      notifyError('Product title is required.');
      return;
    }
    if (!description.trim()) {
      notifyError('Product description is required.');
      return;
    }
    if (!category) {
      notifyError('Please select a category.');
      return;
    }
    if (!brand) {
      notifyError('Please select a brand.');
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      notifyError('Please enter a valid price.');
      return;
    }

    const numericDiscountPrice = discountPrice ? Number(discountPrice) : 0;
    if (isNaN(numericDiscountPrice) || numericDiscountPrice < 0) {
      notifyError('Please enter a valid discount price.');
      return;
    }
    if (numericDiscountPrice > numericPrice) {
      notifyError('Discount price cannot exceed the original price.');
      return;
    }

    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0) {
      notifyError('Stock quantity must be a non-negative number.');
      return;
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      notifyError('Product must have at least one image.');
      return;
    }

    setIsSubmitting(true);
    try {
      const validSpecs = specs.filter((s) => s.key.trim() !== '' && s.value.trim() !== '');

      // Build variants from sizes
      const variantsPayload = sizes.map((size) => ({
        name: size,
        size,
        color: '',
        price: null,
        discountPrice: null,
        stock: null,
        sku: '',
        image: '',
      }));

      // Step 1: Update MongoDB Product Document
      const updatePayload = {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        discountPrice: numericDiscountPrice,
        stock: numericStock,
        category,
        brand,
        isFeatured,
        ratings: { average: rating },
        specs: validSpecs,
        sizes,
        variants: variantsPayload,
      };

      await api.put(`/products/${id}`, updatePayload);

      // Step 2: Upload any newly added images with variant metadata
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((img) => {
          formData.append('images', img.file);
          formData.append('variants', img.variant || '');
        });

        await api.post(`/upload/product/${id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      notifySuccess('Product updated successfully');
      navigate('/admin/products');
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to update product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Product</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MongoDB ID: <span className="font-mono text-[11px]">{id}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Basic Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Pricing & Inventory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Discount Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Stock Quantity *
                  </label>
                  <div className="relative">
                    <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sizes & Variants Manager */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FiTag className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                  Sizes & Variants
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Edit sizes/variants. Assign newly uploaded images to specific sizes below.
              </p>
              {/* Quick-add size buttons */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Quick Add:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleQuickSize(s)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        sizes.includes(s)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Custom Size */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Add Custom Size:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                    placeholder="e.g. Single, Double, Queen, King, 5×4 ft, 7×5 ft, 90×108 inch..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomSize}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 active:scale-95 transition-all whitespace-nowrap"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    Add Size
                  </button>
                </div>
              </div>
              {/* Active size chips */}
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                    >
                      {size}
                      <button type="button" onClick={() => removeSize(size)} className="hover:text-red-500 transition-colors">
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                  Product Specifications
                </h3>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  <FiPlus className="h-3.5 w-3.5" /> Add Attribute
                </button>
              </div>

              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Key (e.g. Color, Warranty)"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Space Gray, 1 Year)"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Images */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Product Gallery Images
              </h3>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">Existing Images in Cloudinary:</p>
                  <div className="flex gap-3 flex-wrap">
                    {existingImages.map((img, i) => (
                      <div key={img.public_id || img.url || i} className="relative group">
                        <img
                          src={img.url}
                          alt={`Existing ${i + 1}`}
                          className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          disabled={deletingImageId === img.public_id}
                          onClick={() => handleDeleteExistingImage(img)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow transition-transform hover:scale-110 disabled:opacity-50"
                          title="Delete from Cloudinary"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded shadow">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images Box */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'
                }`}
              >
                <FiUploadCloud className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Add more images: Drag & drop or <span className="text-primary-600 dark:text-primary-400 underline">browse</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB.</p>
              </div>

              {/* New Selected Images Previews */}
              {newImages.length > 0 && (
                <div>
                  <p className="text-xs text-emerald-600 font-medium mb-2">New Images to Upload:</p>
                  {sizes.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                      💡 Assign each image to a size variant using the dropdown below.
                    </p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {newImages.map((img, i) => (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="relative">
                          <img
                            src={img.previewUrl}
                            alt={`New preview ${i + 1}`}
                            className="h-24 w-full rounded-xl object-cover border-2 border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(i)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow transition-transform hover:scale-110"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                          {img.variant && (
                            <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow">
                              {img.variant}
                            </span>
                          )}
                        </div>
                        <select
                          value={img.variant}
                          onChange={(e) => setNewImageVariant(i, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="">— No variant —</option>
                          {sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Visibility & Rating */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Visibility & Rating
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Featured Product
                </span>
              </label>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Product Rating (1.0 - 5.0)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(Math.min(5, Math.max(1, Number(e.target.value))))}
                    className="w-24 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                  />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <FiStar
                          className={`h-5 w-5 ${
                            i < Math.floor(rating)
                              ? 'text-amber-400 fill-amber-400'
                              : i < rating
                              ? 'text-amber-400 fill-amber-200'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-1 text-xs font-bold text-gray-700 dark:text-gray-300">
                      ({rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Organization
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => {
                    const cId = c._id || c.id || '';
                    return (
                      <option key={cId} value={cId}>
                        {c.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Brand *
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => {
                    const bId = b._id || b.id || '';
                    return (
                      <option key={bId} value={bId}>
                        {b.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                fullWidth
                leftIcon={<FiSave className="h-4 w-4" />}
              >
                Save Changes
              </Button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate('/admin/products')}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminEditProduct;
