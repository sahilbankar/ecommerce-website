import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface CartItem {
  id: string; // product ID or cart item ID
  cartItemId?: string;
  productId: string;
  title: string;
  slug?: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  color?: string;
  size?: string;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('cartItems') || '[]'),
  totalAmount: Number(localStorage.getItem('cartTotalAmount') || '0'),
  totalQuantity: Number(localStorage.getItem('cartTotalQuantity') || '0'),
  isLoading: false,
  error: null,
};

const calculateTotals = (state: CartState) => {
  state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
  state.totalAmount = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  localStorage.setItem('cartItems', JSON.stringify(state.items));
  localStorage.setItem('cartTotalAmount', state.totalAmount.toString());
  localStorage.setItem('cartTotalQuantity', state.totalQuantity.toString());
};

const resolveImageUrl = (images?: any[]): string => {
  if (!images || images.length === 0) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  }
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && first.url) return first.url;
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
};

const mapBackendCartToItems = (backendCart: any): CartItem[] => {
  if (!backendCart || !Array.isArray(backendCart.items)) return [];
  return backendCart.items.map((item: any) => {
    const prod = item.product || {};
    const prodId = prod._id || prod.id || item.product;
    const effectivePrice =
      item.price ||
      (prod.discountPrice && prod.discountPrice > 0 ? prod.discountPrice : prod.price) ||
      0;

    return {
      id: item._id || prodId,
      cartItemId: item._id,
      productId: prodId,
      title: prod.title || 'Product',
      slug: prod.slug || '',
      price: Number(effectivePrice),
      image: resolveImageUrl(prod.images),
      quantity: Number(item.quantity || 1),
      stock: prod.stock !== undefined ? Number(prod.stock) : 100,
      color: item.variant?.color || 'Standard',
      size: item.variant?.size || 'Standard',
    };
  });
};

// ── Async Thunks for Cart Backend Synchronization ──────────────────

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];
  try {
    const res = await api.get('/cart');
    const backendCart = res.data?.data?.cart;
    return mapBackendCartToItems(backendCart);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCartAsync = createAsyncThunk(
  'cart/addToCartAsync',
  async (
    payload: {
      product: any;
      quantity?: number;
      color?: string;
      size?: string;
    }
  ) => {
    const { product, quantity = 1, color = 'Standard', size = 'Standard' } = payload;
    const productId = product._id || product.id || product.productId;
    const token = localStorage.getItem('accessToken');

    if (token && productId) {
      try {
        const res = await api.post('/cart', {
          productId,
          quantity,
          variant: { color, size },
        });
        const backendCart = res.data?.data?.cart;
        return mapBackendCartToItems(backendCart);
      } catch {
        // Fallback to local state if backend API error occurs
      }
    }

    // Return mapped local item
    const price =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;

    return [
      {
        id: productId,
        productId,
        title: product.title,
        slug: product.slug,
        price: Number(price),
        image: resolveImageUrl(product.images),
        quantity: Number(quantity),
        stock: product.stock !== undefined ? Number(product.stock) : 100,
        color,
        size,
      },
    ];
  }
);

export const updateQuantityAsync = createAsyncThunk(
  'cart/updateQuantityAsync',
  async (payload: { id: string; cartItemId?: string; quantity: number }) => {
    const { id, cartItemId, quantity } = payload;
    const token = localStorage.getItem('accessToken');

    if (token && cartItemId) {
      try {
        const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
        const backendCart = res.data?.data?.cart;
        return mapBackendCartToItems(backendCart);
      } catch {
        // Fallback to local state
      }
    }

    return { id, quantity };
  }
);

export const removeCartItemAsync = createAsyncThunk(
  'cart/removeCartItemAsync',
  async (payload: { id: string; cartItemId?: string }) => {
    const { id, cartItemId } = payload;
    const token = localStorage.getItem('accessToken');

    if (token && cartItemId) {
      try {
        const res = await api.delete(`/cart/items/${cartItemId}`);
        const backendCart = res.data?.data?.cart;
        return mapBackendCartToItems(backendCart);
      } catch {
        // Fallback
      }
    }

    return id;
  }
);

export const clearCartAsync = createAsyncThunk('cart/clearCartAsync', async () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      await api.delete('/cart');
    } catch {
      // Ignore
    }
  }
  return true;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(
      state,
      action: PayloadAction<{
        product: any;
        quantity?: number;
        color?: string;
        size?: string;
      }>
    ) {
      const { product, quantity = 1, color = 'Standard', size = 'Standard' } = action.payload;
      const productId = product._id || product.id || product.productId;
      const effectivePrice =
        product.discountPrice && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      const existingItem = state.items.find(
        (item) => item.productId === productId || item.id === productId
      );

      if (!existingItem) {
        state.items.push({
          id: productId,
          productId,
          title: product.title,
          slug: product.slug || '',
          price: Number(effectivePrice),
          image: resolveImageUrl(product.images),
          quantity: Number(quantity),
          stock: product.stock !== undefined ? Number(product.stock) : 100,
          color,
          size,
        });
      } else {
        const newQty = existingItem.quantity + Number(quantity);
        if (newQty <= existingItem.stock) {
          existingItem.quantity = newQty;
        } else {
          existingItem.quantity = existingItem.stock;
        }
      }

      calculateTotals(state);
    },

    removeItem(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.items = state.items.filter((item) => item.id !== id && item.cartItemId !== id);
      calculateTotals(state);
    },

    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find(
        (item) => item.id === id || item.cartItemId === id
      );

      if (existingItem && quantity > 0 && quantity <= existingItem.stock) {
        existingItem.quantity = quantity;
      }
      calculateTotals(state);
    },

    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartTotalAmount');
      localStorage.removeItem('cartTotalQuantity');
    },
  },
  extraReducers: (builder) => {
    // fetchCart
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
        calculateTotals(state);
      }
    });

    // addToCartAsync
    builder.addCase(addToCartAsync.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        // If backend returned mapped items list
        const first = action.payload[0] as any;
        if (action.payload.length > 1 || first?.cartItemId) {
          state.items = action.payload;
        } else if (action.payload.length === 1) {
          const item = action.payload[0];
          const existing = state.items.find(
            (i) => i.productId === item.productId || i.id === item.id
          );
          if (existing) {
            existing.quantity = Math.min(
              existing.stock,
              existing.quantity + item.quantity
            );
          } else {
            state.items.push(item);
          }
        }
        calculateTotals(state);
      }
    });

    // updateQuantityAsync
    builder.addCase(updateQuantityAsync.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      } else if (action.payload && typeof action.payload === 'object') {
        const { id, quantity } = action.payload as { id: string; quantity: number };
        const existing = state.items.find((i) => i.id === id || i.cartItemId === id);
        if (existing && quantity > 0) {
          existing.quantity = quantity;
        }
      }
      calculateTotals(state);
    });

    // removeCartItemAsync
    builder.addCase(removeCartItemAsync.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        state.items = action.payload;
      } else if (typeof action.payload === 'string') {
        const id = action.payload;
        state.items = state.items.filter((i) => i.id !== id && i.cartItemId !== id);
      }
      calculateTotals(state);
    });

    // clearCartAsync
    builder.addCase(clearCartAsync.fulfilled, (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalQuantity = 0;
      localStorage.removeItem('cartItems');
      localStorage.removeItem('cartTotalAmount');
      localStorage.removeItem('cartTotalQuantity');
    });
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
