export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

export interface Category {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
  parentCategory?: string;
}

export interface BackendCategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    public_id?: string;
  } | string;
  parentCategory?: {
    _id?: string;
    id?: string;
    name: string;
    slug?: string;
  } | string | null;
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: Category | string;
  brand?: string;
  images: string[];
  ratings: number;
  numReviews: number;
  isNew?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface ProductImage {
  url: string;
  public_id?: string;
  variant?: string;
}

export interface ProductVariant {
  _id?: string;
  name: string;
  size?: string;
  color?: string;
  price?: number | null;
  discountPrice?: number | null;
  stock?: number | null;
  sku?: string;
  image?: string;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Brand {
  _id?: string;
  id?: string;
  name: string;
  logo?: { url: string; public_id?: string } | string;
  website?: string;
  isActive?: boolean;
}

export interface BackendProduct {
  _id?: string;
  id?: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: { _id?: string; id?: string; name: string; slug?: string } | string;
  brand?: { _id?: string; id?: string; name: string; logo?: string } | string;
  images: (ProductImage | string)[];
  ratings?: {
    average: number;
    numReviews: number;
  } | number;
  numReviews?: number;
  specs?: ProductSpec[];
  isFeatured?: boolean;
  isActive?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface FilterState {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  sortBy?: string;
  searchQuery?: string;
}
