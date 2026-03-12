import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

export const fetchInfluencerVideos = createAsyncThunk(
    "influencerVideo/fetchInfluencerVideos",
    async (_, { rejectWithValue }) => {
        try {
            // Assuming the API endpoint is /api/influencer-videos based on directory structure
            const response = await axiosInstance.get("/influencer-videos");
            return response.data.influencerVideos;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const addInfluencerVideo = createAsyncThunk(
    "influencerVideo/addInfluencerVideo",
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/influencer-videos", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data.influencerVideo;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const influencerVideoSlice = createSlice({
    name: "influencerVideo",
    initialState: {
        videos: [],
        loading: false,
        error: null,
        addLoading: false,
        addError: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchInfluencerVideos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInfluencerVideos.fulfilled, (state, action) => {
                state.loading = false;
                state.videos = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchInfluencerVideos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            // Add
            .addCase(addInfluencerVideo.pending, (state) => {
                state.addLoading = true;
                state.addError = null;
            })
            .addCase(addInfluencerVideo.fulfilled, (state, action) => {
                state.addLoading = false;
                state.videos.push(action.payload);
            })
            .addCase(addInfluencerVideo.rejected, (state, action) => {
                state.addLoading = false;
                state.addError = action.payload || action.error.message;
            });
    },
});

export default influencerVideoSlice.reducer;
