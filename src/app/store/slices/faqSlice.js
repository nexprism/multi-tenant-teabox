import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/axiosConfig/axiosInstance';


export const fetchFaqs = createAsyncThunk(
  "faq/fetchFaqs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/faqs?type=website");
      return response.data?.faqs?.data || [];
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
      if (state.faq.loading) {
        return false;
      }
      
      // Prevent API call if cache is valid
      if (
        state.faq.faqs?.length > 0 &&
        state.faq.lastFetched &&
        now - state.faq.lastFetched < CACHE_DURATION
      ) {
        return false; // Cancel the request
      }
      return true; // Proceed with the request
    }
  }
);





const faqSlice = createSlice({
  name: 'faq',
  initialState: {
    faqs: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFaqs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFaqs.fulfilled, (state, action) => {
        state.loading = false;
        state.faqs = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default faqSlice.reducer;
