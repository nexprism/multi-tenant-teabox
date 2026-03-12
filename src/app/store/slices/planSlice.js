import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

// Async thunk to fetch all plans
export const fetchPlans = createAsyncThunk(
  "plan/fetchPlans",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/api/plan");
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const planSlice = createSlice({
  name: "plan",
  initialState: {
    plans: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearPlans: (state) => {
      state.plans = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch plans";
      });
  },
});

export const { clearPlans } = planSlice.actions;
export default planSlice.reducer;