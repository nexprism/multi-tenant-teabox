import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../axiosConfig/axiosInstance';
export const fetchGroupedContent = createAsyncThunk(
    'content/fetchGroupedContent',
    async (_, { rejectWithValue }) => {
       try {
        const response = await axiosInstance.get('/content', {
            params: { action: 'grouped' },
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console?.log('Fetched content:', response.data?.data);
        return {
            sections: response.data.data,
            stats: response.data.stats,
            totalSectionTypes: response.data.totalSectionTypes,
            totalSections: response.data.totalSections
        };
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch content');
    }
    },
    {
      condition: (_, { getState }) => {
        const state = getState();
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        // Prevent concurrent calls if already loading
        if (state.content.loading) {
          return false;
        }
        
        // Prevent API call if cache is valid
        if (
          state.content.groupedContent &&
          state.content.lastFetched &&
          now - state.content.lastFetched < CACHE_DURATION
        ) {
          return false; // Cancel the request
        }
        return true; // Proceed with the request
      }
    }
);

const contentSlice = createSlice({
    name: 'content',
    initialState: {
        groupedContent: null,
        loading: false,
        error: null,
        lastFetched: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchGroupedContent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchGroupedContent.fulfilled, (state, action) => {
                state.loading = false;
                state.groupedContent = action.payload;
                state.lastFetched = Date.now();
            })
            .addCase(fetchGroupedContent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default contentSlice.reducer;