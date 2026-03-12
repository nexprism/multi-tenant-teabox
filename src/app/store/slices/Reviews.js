import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

// Async thunk to fetch reviews
// keep a module-level reference to an in-flight request to avoid duplicate
// network calls when multiple components dispatch `fetchReviews` simultaneously
let inFlightFetchReviews = null;

export const fetchReviews = createAsyncThunk(
  "reviews/fetchReviews",
  async (_, { rejectWithValue }) => {
    try {
      if (inFlightFetchReviews) {
        // reuse the pending promise so we don't issue another HTTP request
        return await inFlightFetchReviews;
      }

      inFlightFetchReviews = axiosInstance
        .get("/review/all", { params: { isActive: true } })
        .then((response) => response.data?.data || [])
        .finally(() => {
          inFlightFetchReviews = null;
        });

      const data = await inFlightFetchReviews;
      console.log("reviews fetched ==> ", data);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    hasFetched: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
        state.hasFetched = true;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reviewSlice.reducer;
