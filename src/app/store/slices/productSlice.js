// src/lib/redux/slices/productSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (payload = {}) => {
    const cacheKey = JSON.stringify(payload);

    const quaryParams = new URLSearchParams();
    payload.page && quaryParams.append("page", payload.page);
    payload.limit && quaryParams.append("limit", payload.limit);
    payload.sortBy && quaryParams.append("sortBy", payload.sortBy);
    payload.sortOrder && quaryParams.append("sortOrder", payload.sortOrder);

    if (payload.category) {
      quaryParams.append("category", payload.category);
    }
    if (payload.subcategory) {
      quaryParams.append("subcategory", payload.subcategory);
    }
    if (payload.minPrice) {
      quaryParams.append("minPrice", payload.minPrice);
    }
    if (payload.maxPrice) {
      quaryParams.append("maxPrice", payload.maxPrice);
    }
    if (payload.searchTerm) {
      quaryParams.append(
        "searchFields",
        JSON.stringify({ name: payload.searchTerm })
      );
    }
    if (payload.isAddon !== undefined) {
      quaryParams.append("isAddon", payload.isAddon);
    }

    if (payload.frequentlyPurchased) {
      quaryParams.append("frequentlyPurchased", payload.frequentlyPurchased);
    }

    // Always only show products with variants on frontend
    quaryParams.append("onlyWithVariants", "true");

    const response = await axiosInstance.get("/product", {
      params: quaryParams,
    });

    // Robust parsing for Dnd-Ecommerce
    const apiData = response.data?.products?.data ||
      response.data?.data?.body?.data ||
      response.data?.body?.data ||
      response.data?.products ||
      response.data?.data ||
      response.data;

    // Helper to extract number from MongoDB object or raw number
    const normalizeNum = (val) => {
      if (!val) return 0;
      if (typeof val === 'object' && val.$numberInt) return parseInt(val.$numberInt);
      if (typeof val === 'object' && val.$numberLong) return parseInt(val.$numberLong);
      return typeof val === 'number' ? val : parseInt(val) || 0;
    };

    const productsArray = apiData?.products || apiData?.result || (Array.isArray(apiData) ? apiData : []);
    const pag = apiData?.pagination || apiData || {};

    const normalizedData = {
      products: productsArray,
      pagination: {
        total: normalizeNum(pag.totalItems || pag.totalDocuments || apiData?.totalDocuments || pag.total || pag.total_items || productsArray.length),
        currentPage: normalizeNum(pag.currentPage || pag.page || payload.page || 1),
        totalPages: normalizeNum(pag.totalPages || pag.total_pages || 1),
        itemsPerPage: normalizeNum(pag.itemsPerPage || pag.limit || payload.limit || 20)
      }
    };

    return { data: normalizedData, cacheKey };
  },
  {
    condition: (payload = {}, { getState }) => {
      const state = getState();
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      // If ignoreCache is provided, always proceed
      if (payload.ignoreCache) {
        return true;
      }

      // Create cache key from payload
      const cacheKey = JSON.stringify(payload);

      // If we are already loading, only block if the PREVIOUS request had the EXACT same payload
      // This allows the SearchPage to "override" a generic Navbar fetch
      if (state.product.loading) {
        // We don't have a clean way to know the *current* loading payload easily without adding it to state,
        // but typically search page will have distinct params from navbar.
        // For now, let's allow it if it's not the same as a valid cached entry.
      }

      const cachedData = state.product.productCache?.[cacheKey];

      // Prevent API call if cache is valid
      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        return false; // Cancel the request
      }
      return true; // Proceed with the request
    }
  }
);

export const fetchAddons = createAsyncThunk(
  "product/fetchAddons",
  async () => {
    const quaryParams = new URLSearchParams();
    quaryParams.append("isAddon", "true");
    quaryParams.append("onlyWithVariants", "true");
    quaryParams.append("limit", "10");

    const response = await axiosInstance.get("/product", {
      params: quaryParams,
    });

    const apiData = response.data?.products?.data?.products ||
      response.data?.products?.data ||
      response.data?.products ||
      [];

    return Array.isArray(apiData) ? apiData : [];
  }
);

export const fetchProductById = createAsyncThunk(
  "product/fetchProductById",
  async (id) => {
    const response = await axiosInstance.get(`/product/${id}`);
    const response2 = await axiosInstance.get(
      `/review?productId=${response.data.product._id}`
    );

    return {
      ...response.data.product,
      reviews: response2.data.data || [],
    };
  }
);

export const addReview = createAsyncThunk(
  "product/addReview",
  async (reviewData) => {
    try {
      const response = await axiosInstance.post("/review", reviewData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  "product/fetchProductReviews",
  async (id) => {
    try {
      const response = await axiosInstance.get(`/review?productId=${id}`);
      // Check for success property in response
      if (response.data && response.data.success === false) {
        // Backend returned an error, return empty array
        return [];
      }
      return response.data.data;
    } catch (error) {
      // Return empty array to avoid crashing
      return [];
    }
  }
);

export const fetchFrequentlyPurchasedProducts = createAsyncThunk(
  "product/fetchFrequentlyPurchasedProducts",
  async (payload) => {
    console.log("frequently api is calling");
    try {
      const quaryParams = new URLSearchParams();
      payload.page && quaryParams.append("page", payload.page);
      payload.limit && quaryParams.append("limit", payload.limit);
      payload.sortBy && quaryParams.append("sortBy", payload.sortBy);

      if (payload.category) {
        quaryParams.append("category", payload.category);
      }

      if (payload.frequentlyPurchased) {
        quaryParams.append("frequentlyPurchased", payload.frequentlyPurchased);
      }

      quaryParams.append("onlyWithVariants", "true");

      const response = await axiosInstance.get("/product", {
        params: quaryParams,
      });

      // Robust parsing for Dnd-Ecommerce (matching fetchProducts logic)
      const apiData = response.data?.products?.data ||
        response.data?.data?.body?.data ||
        response.data?.body?.data ||
        response.data?.products ||
        response.data?.data ||
        response.data;

      const productsArray = apiData?.products || apiData?.result || (Array.isArray(apiData) ? apiData : []);
      return productsArray;
    } catch (error) {
      throw error;
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: {
    selectedProduct: null,
    products: [],
    pagination: {
      total: 0,
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 20
    },
    loading: false,
    error: null,
    productCache: {},
    addons: [],
    frequentlyPurchased: [], // Separate state for homepage slider
    currentVariantImage: null, // Add this line
  },
  reducers: {
    resetProductState: (state) => {
      state.products = [];
      state.pagination = null;
      state.loading = true; // Set to true to show spinner immediately
      state.productCache = {}; // Also clear cache to be safe
      state.currentVariantImage = null; // Reset variant image
    },
    setCurrentVariantImage: (state, action) => {
      state.currentVariantImage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        const responseData = action.payload.data || action.payload;

        // Ensure products and pagination are always extracted correctly
        state.products = responseData.products || (Array.isArray(responseData) ? responseData : []);
        state.pagination = responseData.pagination || {
          total: state.products.length,
          currentPage: 1,
          totalPages: 1,
          itemsPerPage: 20
        };

        if (action.payload.cacheKey) {
          state.productCache[action.payload.cacheKey] = {
            data: responseData,
            timestamp: Date.now(),
          };
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentVariantImage = null; // Reset on new product fetch
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchAddons.fulfilled, (state, action) => {
        state.addons = action.payload;
      })
      .addCase(fetchFrequentlyPurchasedProducts.fulfilled, (state, action) => {
        state.frequentlyPurchased = action.payload;
      });
  },
});

const selectSelectedProduct = (state) => state.product.selectedProduct;
const selectCurrentVariantImage = (state) => state.product.currentVariantImage;
const removeSelectedProduct = (state) => {
  state.product.selectedProduct = null;
};

export const { resetProductState, setCurrentVariantImage } = productSlice.actions;
export { selectSelectedProduct, selectCurrentVariantImage, removeSelectedProduct };

export default productSlice.reducer;
