import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud,
  FiX,
  FiChevronLeft,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiTag,
  FiStar,
} from 'react-icons/fi';
import axios from 'axios';
import { api } from '../../services/api';
import { Category, Brand, ProductSpec } from '../../types';
import { notifySuccess, notifyError } from '../../components/Toast';
import Button from '../../components/Button';

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

interface ImagePreview {
  file: File;
  previewUrl: string;
  variant: string;
}

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export const AdminAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories & Brands list from backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(true);

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
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { key: 'Material', value: '' },
  ]);

  // Sizes state
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Selected Images & Previews
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real Categories and Brands from API on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      setFetchingMeta(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);

        const catList = catRes.data?.data?.categories || [];
        const brandList = brandRes.data?.data?.brands || [];

        setCategories(catList);
        setBrands(brandList);

        if (catList.length > 0) {
          setCategory(catList[0]._id || catList[0].id || '');
        }
        if (brandList.length > 0) {
          setBrand(brandList[0]._id || brandList[0].id || '');
        }
      } catch (error: unknown) {
        notifyError(getErrorMessage(error, 'Failed to load categories and brands'));
      } finally {
        setFetchingMeta(false);
      }
    };

    fetchMetadata();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [selectedImages]);

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
    setSelectedImages((prev) =>
      prev.map((img) => (img.variant === size ? { ...img, variant: '' } : img))
    );
  };

  const setImageVariant = (index: number, variant: string) => {
    setSelectedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, variant } : img))
    );
  };

  // Handle Image File Selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((file) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );

    if (newFiles.length === 0) {
      notifyError('Please select valid image files (JPEG, PNG, WEBP).');
      return;
    }

    if (selectedImages.length + newFiles.length > 10) {
      notifyError('You can upload a maximum of 10 images per product.');
      return;
    }

    const newPreviews: ImagePreview[] = newFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      variant: '',
    }));

    setSelectedImages((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
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

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!title.trim()) {
      notifyError('Product title is required.');
      return;
    }
    if (!description.trim()) {
      notifyError('Product description is required.');
      return;
    }
    if (!category) {
      notifyError('Please select a product category.');
      return;
    }
    if (!brand) {
      notifyError('Please select a product brand.');
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      notifyError('Please enter a valid price (greater than or equal to 0).');
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

    if (selectedImages.length === 0) {
      notifyError('Please add at least one product image.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Filter out empty specs
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

      // Step 1: Create Product Document in MongoDB
      const productPayload = {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        discountPrice: numericDiscountPrice,
        stock: numericStock,
        category,
        brand,
        isFeatured,
        ratings: { average: rating, numReviews: 0 },
        specs: validSpecs,
        sizes,
        colors: [],
        variants: variantsPayload,
      };

      const createRes = await api.post('/products', productPayload);
      const createdProduct = createRes.data?.data?.product;
      const productId = createdProduct?._id || createdProduct?.id;

      if (!productId) {
        throw new Error('Failed to retrieve created product ID from response.');
      }

      // Step 2: Upload images with variant metadata
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((img) => {
          formData.append('images', img.file);
          formData.append('variants', img.variant || '');
        });

        await api.post(`/upload/product/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      notifySuccess('Product created successfully');
      navigate('/admin/products');
    } catch (error: unknown) {
      notifyError(getErrorMessage(error, 'Failed to create product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Product</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fill in the details to publish a new product to MongoDB and Cloudinary
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Details) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Information */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Basic Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
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
                  placeholder="Detailed description of features, materials, and build quality..."
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
                    Original Price (₹) *
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
                      placeholder="999.00"
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
                      placeholder="799.00 (Optional)"
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
                      placeholder="100"
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
                Add sizes/variants. You can assign each uploaded image to a specific size below.
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
              {/* Custom size input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                  placeholder="Custom size (e.g. 28, UK 8, 42)"
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
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
                      placeholder="Value (e.g. Midnight Black, 2 Years)"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {specs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Images Upload */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Product Gallery Images *
              </h3>
              {sizes.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  💡 Assign each image to a size variant using the dropdown below each image.
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'
                }`}
              >
                <FiUploadCloud className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drag & drop image files here, or <span className="text-primary-600 dark:text-primary-400 underline">browse files</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Upload up to 10 image files (PNG, JPG, WEBP). Max 5MB per file.
                </p>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  {selectedImages.map((img, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="relative">
                        <img
                          src={img.previewUrl}
                          alt={`Preview ${i + 1}`}
                          className="h-24 w-full rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(i)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow transition-transform hover:scale-110"
                          title="Remove image"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded shadow">
                            Main
                          </span>
                        )}
                        {img.variant && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow">
                            {img.variant}
                          </span>
                        )}
                      </div>
                      <select
                        value={img.variant}
                        onChange={(e) => setImageVariant(i, e.target.value)}
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
              )}
            </div>
          </div>


          {/* Right Column (Organization & Submit) */}
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

            {/* Category & Brand (Loaded from MongoDB) */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
                Organization
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category *
                </label>
                {fetchingMeta ? (
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ) : (
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
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Brand *
                </label>
                {fetchingMeta ? (
                  <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ) : (
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
                )}
              </div>
            </div>

            {/* Sizes summary */}
            {sizes.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 shadow-sm">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  {sizes.length} Size{sizes.length > 1 ? 's' : ''} Configured
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  {sizes.join(', ')}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                fullWidth
                leftIcon={<FiCheckCircle className="h-4 w-4" />}
              >
                Publish Product
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

export default AdminAddProduct;
