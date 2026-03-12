import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstances from "@/axiosConfig/axiosInstance";
export const addToWishlist = createAsyncThunk(
  "wishlist/addToWishlist",
  async ({ product, variant, token, tenant }, { rejectWithValue }) => {
    try {
      const response = await axiosInstances.post("/wishlist", {
        product,
        variant,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstances.get("/wishlist");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async ({ productId, variantId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstances.delete(`/wishlist/`, {
        params: { productId, variantId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  initialized: false, // Added to track if wishlist has been loaded at least once
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearWishlistState: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        const response = action.payload;
        
        // Prefer the full wishlist from the response if available
        if (response?.wishlist?.items && Array.isArray(response.wishlist.items)) {
          state.items = response.wishlist.items;
        } else if (response?.items && Array.isArray(response.items)) {
          state.items = response.items;
        } else if (Array.isArray(response)) {
          state.items = response;
        } else if (response?.product || response?.productId) {
          // If only a single item is returned, add it if not already present
          const newItem = response?.wishlist || response;
          const newItemProductId = String(newItem.product?._id || newItem.product || newItem.productId || '');
          const newItemVariantId = String(newItem.variant?._id || newItem.variant || newItem.variantId || '');
          
          const exists = state.items.some(item => {
            const itemProductId = String(item.product?._id || item.product || item.productId || '');
            const itemVariantId = String(item.variant?._id || item.variant || item.variantId || '');
            return itemProductId === newItemProductId && itemVariantId === newItemVariantId;
          });
          
          if (!exists) {
            state.items.push(newItem);
          }
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        let items = action.payload?.wishlist?.items || action.payload?.items || action.payload;
        state.items = Array.isArray(items) ? items : [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.initialized = true; // Even if it fails, we consider it "initialized" to stop falling back
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        
        // If the backend returns the updated wishlist, use it
        const response = action.payload;
        if (response?.wishlist?.items && Array.isArray(response.wishlist.items)) {
          state.items = response.wishlist.items;
          return;
        }
        
        // Fallback: Remove the item locally using the args passed to the thunk
        const productId = action?.meta?.arg?.productId;
        const variantId = action?.meta?.arg?.variantId;
        
        if (productId) {
          const productIdStr = String(productId);
          const variantIdStr = variantId ? String(variantId) : null;
          
          state.items = state.items.filter((item) => {
            const itemProduct = item.product;
            const itemProductId = String(
              (typeof itemProduct === 'object' ? (itemProduct?._id || itemProduct?.id) : itemProduct) || ''
            );
            
            if (itemProductId !== productIdStr) {
              return true;
            }
            
            if (variantIdStr) {
              const itemVariant = item.variant;
              const itemVariantId = String(
                (typeof itemVariant === 'object' ? (itemVariant?._id || itemVariant?.id) : itemVariant) || ''
              );
              
              if (itemVariantId !== variantIdStr) {
                return true;
              }
            }
            
            return false;
          });
        }
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const selectWishlistItems = (state) => state.wishlist.items;

export { selectWishlistItems };

export default wishlistSlice.reducer;
