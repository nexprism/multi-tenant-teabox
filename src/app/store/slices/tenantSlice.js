import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

// Async thunk to fetch tenants
export const fetchTenants = createAsyncThunk(
  "tenant/fetchTenants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/api/tenant");
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const tenantSlice = createSlice({
  name: "tenant",
  initialState: {
    tenants: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTenants: (state) => {
      state.tenants = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = action.payload;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch tenants";
      });
  },
});

export const { clearTenants } = tenantSlice.actions;
export default tenantSlice.reducer;