import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../../axiosConfig/axiosInstance";

// Async thunk to fetch all dynamic pages
export const fetchPages = createAsyncThunk(
  "pages/fetchPages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/page?groupByMainTitle=true", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console?.log("Fetched pages:", response.data?.data);

      return {
        pages: response.data?.data || [],
        totalPages: response.data?.totalPages || 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch pages"
      );
    }
  }
);

// Async thunk to fetch a single page by slug or id
export const fetchPageBySlug = createAsyncThunk(
  "pages/fetchPageBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/pages/${slug}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console?.log(`Fetched page [${slug}]:`, response.data?.data);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch page details"
      );
    }
  }
);

// Slice for pages
const pagesSlice = createSlice({
  name: "pages",
  initialState: {
    list: [], // all pages (e.g., About, Blog, Contact)
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedPage: (state) => {
      state.selectedPage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all pages
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.pages;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single page
      .addCase(fetchPageBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPageBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPage = action.payload;
      })
      .addCase(fetchPageBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedPage } = pagesSlice.actions;
export default pagesSlice.reducer;
