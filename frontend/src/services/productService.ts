import { api } from './api';
import { BackendProduct, FilterState, Product } from '../types';

/**
 * Normalizes backend product schema into frontend product representation.
 */
export const mapBackendProduct = (p: BackendProduct): Product => {
  const catObj = typeof p.category === 'object' && p.category !== null ? p.category : null;
  const ratingsAvg =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.average : (p.ratings as number) || 0;
  const numReviews =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.numReviews : p.numReviews || 0;

  const isRecent = p.createdAt
    ? Date.now() - new Date(p.createdAt).getTime() < 45 * 24 * 60 * 60 * 1000
    : false;

  return {
    _id: p._id,
    id: p._id || p.id || '',
    title: p.title,
    slug: p.slug || '',
    description: p.description,
    price: p.price,
    discountPrice: p.discountPrice,
    stock: p.stock,
    category: catObj
      ? { id: catObj._id || catObj.id || '', name: catObj.name, slug: catObj.slug || '' }
      : String(p.category || ''),
    brand:
      p.brand && typeof p.brand === 'object'
        ? p.brand.name
        : String(p.brand || ''),
    images: (p.images || []) as unknown as string[],
    ratings: ratingsAvg,
    numReviews,
    isFeatured: Boolean(p.isFeatured),
    isNew: isRecent,
  };
};

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sort?: string;
  isFeatured?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Service to handle all product-related API operations.
 */
export const productService = {
  /**
   * Fetch products with query parameters (filtering, sorting, pagination).
   */
  async getProducts(params?: FetchProductsParams): Promise<ProductsResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.keyword) queryParams.keyword = params.keyword;
    if (params?.category) queryParams.category = params.category;
    if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
    if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
    if (params?.rating !== undefined) queryParams.rating = params.rating;
    if (params?.inStock) queryParams.inStock = 'true';
    if (params?.sort) queryParams.sort = params.sort;
    if (params?.isFeatured) queryParams.isFeatured = 'true';

    const response = await api.get('/products', { params: queryParams });
    const data = response.data?.data;
    const rawProducts: BackendProduct[] = data?.products || [];
    const pagination = data?.pagination;

    return {
      products: rawProducts.map(mapBackendProduct),
      totalProducts: pagination?.totalProducts ?? rawProducts.length,
      totalPages: pagination?.totalPages ?? 1,
      currentPage: pagination?.currentPage ?? (params?.page || 1),
    };
  },

  /**
   * Fetch featured/trending products for display sections.
   */
  async getFeaturedProducts(limit = 12): Promise<Product[]> {
    const response = await api.get('/products', {
      params: { isFeatured: 'true', limit },
    });
    const raw: BackendProduct[] = response.data?.data?.products || [];
    return raw.map(mapBackendProduct);
  },

  /**
   * Fetch latest arrivals sorted by newest creation date.
   */
  async getNewArrivals(limit = 12): Promise<Product[]> {
    const response = await api.get('/products', {
      params: { sort: 'newest', limit },
    });
    const raw: BackendProduct[] = response.data?.data?.products || [];
    return raw.map(mapBackendProduct);
  },

  /**
   * Fetch a single product by either its 24-character MongoDB ID or URL slug.
   */
  async getProductByIdOrSlug(idOrSlug: string): Promise<BackendProduct> {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const endpoint = isMongoId ? `/products/${idOrSlug}` : `/products/slug/${idOrSlug}`;

    try {
      const response = await api.get(endpoint);
      const product = response.data?.data?.product;
      if (!product) throw new Error('Product not found in response');
      return product;
    } catch (err) {
      // Fallback try alternate endpoint if initial attempt failed
      const alternate = isMongoId ? `/products/slug/${idOrSlug}` : `/products/${idOrSlug}`;
      const fallbackResponse = await api.get(alternate);
      const product = fallbackResponse.data?.data?.product;
      if (!product) throw err;
      return product;
    }
  },

  /**
   * Fetch related products for product details page based on category.
   */
  async getRelatedProducts(categoryId: string, excludeId?: string, limit = 4): Promise<Product[]> {
    if (!categoryId) return [];
    try {
      const response = await api.get('/products', {
        params: { category: categoryId, limit: limit + 1 },
      });
      const raw: BackendProduct[] = response.data?.data?.products || [];
      return raw
        .filter((p) => (p._id || p.id) !== excludeId)
        .slice(0, limit)
        .map(mapBackendProduct);
    } catch {
      return [];
    }
  },
};

export default productService;
