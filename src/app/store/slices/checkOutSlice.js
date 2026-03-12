import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const CHECKOUT_STATE_KEY = "dnd_ecommerce_checkout_open";


export const setAddress = createAsyncThunk(
  "checkout/setAddress",
  async (address, { rejectWithValue }) => {
    try {
      localStorage.setItem("address", JSON.stringify(address));
      return address;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const placeOrder = createAsyncThunk(
  "checkout/placeOrder",
  async (orderDetails, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/orders/place", orderDetails);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState: {
    checkoutOpen: false,
    checkoutData: {},
    addressAdded:
      (isBrowser && localStorage.getItem("address") && true) || false,
    addressData:
      (isBrowser && JSON.parse(localStorage.getItem("address"))) || {},
    loading: false,
    error: null,
  },
  reducers: {
    setCheckoutOpen: (state) => {
      state.checkoutOpen = true;
      if (isBrowser) localStorage.setItem(CHECKOUT_STATE_KEY, "true");
    },
    resetAddress: (state) => {
      state.addressAdded = false;
      state.addressData = {};
    },
    setCheckoutClose: (state) => {
      state.checkoutOpen = false;
      if (isBrowser) localStorage.removeItem(CHECKOUT_STATE_KEY);
    },
    restoreCheckoutState: (state) => {
      if (isBrowser) {
        const isOpen = localStorage.getItem(CHECKOUT_STATE_KEY) === "true";
        if (isOpen) state.checkoutOpen = true;
      }
    },
    getAddressFormLocalStorage: (state) => {
      state.addressData = isBrowser
        ? JSON.parse(localStorage.getItem("address")) || {}
        : {};
    },
    setCheckoutData: (state, action) => {
      state.checkoutData = action.payload;
    },
    clearCheckoutData: (state) => {
      state.checkoutData = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addressAdded = true;
        state.addressData = action.payload;
      })
      .addCase(setAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setCheckoutOpen,
  setCheckoutClose,
  setCheckoutData,
  clearCheckoutData,
  resetAddress,
  getAddressFormLocalStorage,
  restoreCheckoutState,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
