import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

// Async thunk to fetch variants
export const fetchVariants = createAsyncThunk(
  "variant/fetchVariants",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/api/variant");
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const variantSlice = createSlice({
  name: "variant",
  initialState: {
    variants: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearVariants: (state) => {
      state.variants = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVariants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVariants.fulfilled, (state, action) => {
        state.loading = false;
        state.variants = action.payload;
      })
      .addCase(fetchVariants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch variants";
      });
  },
});

export const { clearVariants } = variantSlice.actions;
export default variantSlice.reducer;
