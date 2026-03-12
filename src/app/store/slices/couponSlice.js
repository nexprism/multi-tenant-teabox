import axiosInstance from "@/axiosConfig/axiosInstance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch coupons
export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/coupon");
      console.log("Fetched coupons:", response.data);
      return response.data?.coupons?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      // Prevent concurrent calls if already loading
      if (state.coupons.loading) {
        return false;
      }
      
      // Prevent API call if cache is valid
      if (
        state.coupons.items?.length > 0 &&
        state.coupons.lastFetched &&
        now - state.coupons.lastFetched < CACHE_DURATION
      ) {
        return false; // Cancel the request
      }
      return true; // Proceed with the request
    }
  }
);

export const applyCoupon = createAsyncThunk(
  "coupons/applyCoupon",
  async ({ code, total, cartItems = [], paymentMethod = 'prepaid', customerId: passedCustomerId }, { rejectWithValue }) => {
    try {
      // Base payload
      const payload = {
        code,
        cartValue: total,
        cartItems,        // pass cart items so server can evaluate product-level rules
        paymentMethod     // pass payment method for payment-specific discounts/rules
      };

      // Determine customerId: prefer passedCustomerId, otherwise read from client-side localStorage if available
      let customerId = passedCustomerId;
      if (!customerId && typeof window !== "undefined" && window.localStorage) {
        try {
          const user = JSON.parse(window.localStorage.getItem("user") || "{}");
          customerId = user?.id || user?._id || null;
        } catch (e) {
          customerId = null;
        }
      }

      // Add customerId only if present
      if (customerId) {
        payload.customerId = customerId;
      }

      const response = await axiosInstance.post("/coupon/apply", payload);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const couponSlice = createSlice({
  name: "coupons",
  initialState: {
    items: [],
    loading: false,
    error: null,
    selectedCoupon: null,
    lastFetched: null,
  },
  reducers: {
    setSelectedCoupon: (state, action) => {
      state.selectedCoupon = action.payload;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCoupon, clearSelectedCoupon } = couponSlice.actions;
export default couponSlice.reducer;
