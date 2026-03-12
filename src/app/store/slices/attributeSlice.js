import axiosInstance from "@/axiosConfig/axiosInstance";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch attributes
export const fetchAttributes = createAsyncThunk(
  "attribute/fetchAttributes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/api/attribute");
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const attributeSlice = createSlice({
  name: "attribute",
  initialState: {
    attributes: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAttributes: (state) => {
      state.attributes = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.loading = false;
        state.attributes = action.payload;
      })
      .addCase(fetchAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch attributes";
      });
  },
});

export const { clearAttributes } = attributeSlice.actions;
export default attributeSlice.reducer;