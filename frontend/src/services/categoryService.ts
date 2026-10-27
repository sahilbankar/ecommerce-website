import { api } from './api';
import { Category, BackendCategory } from '../types';

/**
 * Normalizes backend category response into frontend Category interface.
 */
export const mapBackendCategory = (cat: BackendCategory | any): Category => {
  const imageUrl =
    typeof cat.image === 'string'
      ? cat.image
      : cat.image?.url || '';

  return {
    _id: cat._id,
    id: cat._id || cat.id || '',
    name: cat.name,
    slug: cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: cat.description || '',
    image: imageUrl,
    productCount: cat.productCount,
    parentCategory: typeof cat.parentCategory === 'object' && cat.parentCategory !== null
      ? cat.parentCategory._id || cat.parentCategory.id
      : cat.parentCategory,
  };
};

/**
 * Service to handle category-related operations.
 */
export const categoryService = {
  /**
   * Fetch all active product categories from the backend.
   */
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    const rawCategories: BackendCategory[] = response.data?.data?.categories || [];
    return rawCategories
      .filter((c: any) => c.isActive !== false)
      .map(mapBackendCategory);
  },

  /**
   * Fetch a single category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await api.get(`/categories/${slug}`);
      const raw = response.data?.data?.category;
      return raw ? mapBackendCategory(raw) : null;
    } catch {
      return null;
    }
  },
};

export default categoryService;
