import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { Product } from '../../types';
import { logout } from './authSlice';

interface WishlistState {
  items: Product[];
  isLoading: boolean;
  error: string | null;
}

const getStoredWishlist = (): Product[] => {
  try {
    const raw = localStorage.getItem('wishlistItems');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const initialState: WishlistState = {
  items: getStoredWishlist(),
  isLoading: false,
  error: null,
};

const saveToLocalStorage = (items: Product[]) => {
  try {
    localStorage.setItem('wishlistItems', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save wishlist to localStorage', e);
  }
};

export const mapBackendProductToFrontend = (p: any): Product => {
  if (!p) return null as unknown as Product;

  const catObj = typeof p.category === 'object' && p.category !== null ? p.category : null;
  const brandObj = typeof p.brand === 'object' && p.brand !== null ? p.brand : null;
  const ratingsAvg =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.average : (p.ratings as number) || 0;
  const numReviews =
    p.ratings && typeof p.ratings === 'object' ? p.ratings.numReviews : p.numReviews || 0;

  // Extract all valid image URLs
  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images
      .map((img: any) => {
        if (typeof img === 'string' && img.trim()) return img.trim();
        if (img && typeof img === 'object' && typeof img.url === 'string' && img.url.trim()) {
          return img.url.trim();
        }
        return '';
      })
      .filter(Boolean);
  } else if (typeof p.images === 'string' && p.images.trim()) {
    images = [p.images.trim()];
  }

  return {
    _id: p._id,
    id: p._id || p.id || '',
    title: p.title || 'Product',
    slug: p.slug || '',
    description: p.description || '',
    price: p.price || 0,
    discountPrice: p.discountPrice,
    stock: p.stock !== undefined ? p.stock : 100,
    category: catObj
      ? { id: catObj._id || catObj.id || '', name: catObj.name, slug: catObj.slug || '' }
      : String(p.category || ''),
    brand: brandObj ? brandObj.name : String(p.brand || ''),
    images,
    ratings: ratingsAvg,
    numReviews,
    isFeatured: p.isFeatured,
  };
};

export const mapBackendWishlist = (backendWishlist: any): Product[] => {
  if (!backendWishlist || !Array.isArray(backendWishlist.products)) return [];
  return backendWishlist.products
    .filter((p: any) => p !== null && p !== undefined && typeof p === 'object')
    .map(mapBackendProductToFrontend)
    .filter(Boolean);
};

// ── Async Thunks ───────────────────────────────────────────────────

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return getStoredWishlist();
    }
    try {
      const res = await api.get('/wishlist');
      const backendWishlist = res.data?.data?.wishlist || res.data?.wishlist;
      return mapBackendWishlist(backendWishlist);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch wishlist'
      );
    }
  }
);

export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlistAsync',
  async (product: Product, { rejectWithValue }) => {
    const productId = product._id || product.id;
    const token = localStorage.getItem('accessToken');

    if (token && productId) {
      try {
        const res = await api.post('/wishlist', { productId });
        const backendWishlist = res.data?.data?.wishlist || res.data?.wishlist;
        return mapBackendWishlist(backendWishlist);
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to add to wishlist'
        );
      }
    }

    return product;
  }
);

export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlistAsync',
  async (productId: string, { rejectWithValue }) => {
    const token = localStorage.getItem('accessToken');

    if (token && productId) {
      try {
        const res = await api.delete(`/wishlist/${productId}`);
        const backendWishlist = res.data?.data?.wishlist || res.data?.wishlist;
        return mapBackendWishlist(backendWishlist);
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to remove from wishlist'
        );
      }
    }

    return productId;
  }
);

export const clearWishlistAsync = createAsyncThunk(
  'wishlist/clearWishlistAsync',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await api.delete('/wishlist');
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.message || error.message || 'Failed to clear wishlist'
        );
      }
    }
    return [];
  }
);

export const toggleWishlistAsync = createAsyncThunk(
  'wishlist/toggleWishlistAsync',
  async (product: Product, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as { wishlist: WishlistState };
    const productId = product._id || product.id;
    const exists = state.wishlist.items.some(
      (item) => (item._id || item.id) === productId
    );

    if (exists) {
      const result = await dispatch(removeFromWishlistAsync(productId));
      if (removeFromWishlistAsync.rejected.match(result)) {
        return rejectWithValue(result.payload);
      }
      return { added: false, product };
    } else {
      const result = await dispatch(addToWishlistAsync(product));
      if (addToWishlistAsync.rejected.match(result)) {
        return rejectWithValue(result.payload);
      }
      return { added: true, product };
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist(state, action: PayloadAction<Product>) {
      const product = action.payload;
      const productId = product._id || product.id;
      const exists = state.items.some((item) => (item._id || item.id) === productId);

      if (!exists) {
        state.items.push(product);
        saveToLocalStorage(state.items);
      }
    },

    removeFromWishlist(state, action: PayloadAction<string>) {
      const productId = action.payload;
      state.items = state.items.filter((item) => (item._id || item.id) !== productId);
      saveToLocalStorage(state.items);
    },

    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem('wishlistItems');
    },
  },
  extraReducers: (builder) => {
    // fetchWishlist
    builder.addCase(fetchWishlist.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchWishlist.fulfilled, (state, action) => {
      state.isLoading = false;
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
        saveToLocalStorage(state.items);
      }
    });
    builder.addCase(fetchWishlist.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Failed to load wishlist';
    });

    // addToWishlistAsync
    builder.addCase(addToWishlistAsync.pending, (state) => {
      state.error = null;
    });
    builder.addCase(addToWishlistAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      } else if (action.payload && typeof action.payload === 'object') {
        const prod = action.payload as Product;
        const productId = prod._id || prod.id;
        const exists = state.items.some((i) => (i._id || i.id) === productId);
        if (!exists) {
          state.items.push(prod);
        }
      }
      saveToLocalStorage(state.items);
    });
    builder.addCase(addToWishlistAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Failed to add product to wishlist';
    });

    // removeFromWishlistAsync
    builder.addCase(removeFromWishlistAsync.pending, (state) => {
      state.error = null;
    });
    builder.addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      } else if (typeof action.payload === 'string') {
        const id = action.payload;
        state.items = state.items.filter((i) => (i._id || i.id) !== id);
      }
      saveToLocalStorage(state.items);
    });
    builder.addCase(removeFromWishlistAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || 'Failed to remove product from wishlist';
    });

    // clearWishlistAsync
    builder.addCase(clearWishlistAsync.fulfilled, (state) => {
      state.items = [];
      localStorage.removeItem('wishlistItems');
    });

    // Clear wishlist on user logout
    builder.addCase(logout, (state) => {
      state.items = [];
      localStorage.removeItem('wishlistItems');
    });
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
