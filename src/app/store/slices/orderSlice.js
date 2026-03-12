// src/lib/redux/slices/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

// Async thunk to fetch all orders
export const fetchOrders = createAsyncThunk(
  "order/fetchOrders",
  async (payload = {}) => {
    const queryParams = new URLSearchParams();
    if (payload && payload.page) {
      queryParams.append("page", payload.page);
    }
    queryParams.append("limit", 10000);

    queryParams.append("sort", JSON.stringify({ createdAt: "desc" }));

    // if (payload.userId) {
    //   queryParams.append("userId", payload.userId);
    // }
    if (payload.status) {
      queryParams.append("status", payload.status);
    }

    const response = await axiosInstance.get(`/orders/place`, {
      params: queryParams,
    });

    return response.data.data;
  }
);

// Async thunk to fetch a single order by ID
export const fetchOrderById = createAsyncThunk(
  "order/fetchOrderById",
  async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data.data;
  }
);
// Async thunk to cancel an order
export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (orderId) => {
    const response = await axiosInstance.put(`/orders/${orderId}/cancel`);
    return response.data.data;
  }
);

// Slice
const orderSlice = createSlice({
  name: "order",
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both array response and object with orders array
        state.orders = Array.isArray(action.payload) 
          ? action.payload 
          : (action.payload?.orders || action.payload?.data || []);
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentOrder && state.currentOrder._id === action.payload._id) {
          state.currentOrder = { ...state.currentOrder, status: 'cancelled' };
        }
        // Update in orders list if present
        const index = state.orders.findIndex(o => o._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], status: 'cancelled' };
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default orderSlice.reducer;
