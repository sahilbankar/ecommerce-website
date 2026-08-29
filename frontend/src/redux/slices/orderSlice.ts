import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface OrderItem {
  product: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  variant?: { color?: string; size?: string };
  isReviewed?: boolean;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType?: string;
}

export interface Order {
  _id: string;
  user: { _id?: string; name?: string; email?: string } | string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  orderItems: {
    product: string;
    price: number;
    quantity: number;
    variant?: { color?: string; size?: string };
  }[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  couponCode?: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  isCreating: boolean;
  isCancelling: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  isCreating: false,
  isCancelling: false,
  error: null,
};

export const createOrder = createAsyncThunk(
  'orders/create',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/orders', payload);
      return res.data?.data?.order as Order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order');
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'orders/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/my-orders');
      return res.data?.data?.orders as Order[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get('/orders/' + id);
      return res.data?.data?.order as Order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
    }
  }
);

export const cancelOrderAsync = createAsyncThunk(
  'orders/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.put('/orders/' + id + '/cancel');
      return res.data?.data?.order as Order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

export const deleteOrderAsync = createAsyncThunk(
  'orders/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete('/orders/' + id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete order');
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params: { page?: number; limit?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, status } = params;
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status && status !== 'All') query.set('status', status);
      const res = await api.get('/orders?' + query.toString());
      return { orders: res.data?.data?.orders as Order[], pagination: res.data?.data?.pagination };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async (payload: { id: string; status: string; trackingNumber?: string }, { rejectWithValue }) => {
    try {
      const res = await api.put('/orders/' + payload.id + '/status', {
        status: payload.status,
        trackingNumber: payload.trackingNumber,
      });
      return res.data?.data?.order as Order;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder(state) { state.currentOrder = null; },
    clearOrderError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.isCreating = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, action) => { state.isCreating = false; state.currentOrder = action.payload; })
      .addCase(createOrder.rejected, (state, action) => { state.isCreating = false; state.error = action.payload as string; });
    builder
      .addCase(fetchMyOrders.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.isLoading = false; state.orders = action.payload; })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(fetchOrderById.pending, (state) => { state.isLoading = true; })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.isLoading = false; state.currentOrder = action.payload; })
      .addCase(fetchOrderById.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(cancelOrderAsync.pending, (state) => { state.isCancelling = true; })
      .addCase(cancelOrderAsync.fulfilled, (state, action) => {
        state.isCancelling = false;
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
        if (state.currentOrder?._id === action.payload._id) state.currentOrder = action.payload;
      })
      .addCase(cancelOrderAsync.rejected, (state, action) => { state.isCancelling = false; state.error = action.payload as string; });
    builder
      .addCase(deleteOrderAsync.pending, (state) => { state.isLoading = true; })
      .addCase(deleteOrderAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = state.orders.filter(o => o._id !== action.payload);
        if (state.currentOrder?._id === action.payload) state.currentOrder = null;
      })
      .addCase(deleteOrderAsync.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(fetchAllOrders.pending, (state) => { state.isLoading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.isLoading = false; state.orders = action.payload.orders; })
      .addCase(fetchAllOrders.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });
    builder
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.orders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.orders[idx] = action.payload;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => { state.error = action.payload as string; });
  },
});

export const { clearCurrentOrder, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
