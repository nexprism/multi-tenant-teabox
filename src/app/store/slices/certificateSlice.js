import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

export const fetchCertificates = createAsyncThunk(
  "certificate/fetchCertificates",
  async ({ page = 1, limit = 20 } = {}) => {
    const response = await axiosInstance.get(
      `/certificates?page=${page}&limit=${limit}`
    );

    console.log("response of certificate fetch ==> ", response.data);
    return response.data.data;
  }
);

const certificateSlice = createSlice({
  name: "certificate",
  initialState: {
    certificates: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCertificates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCertificates.fulfilled, (state, action) => {
        state.loading = false;
        state.certificates = action.payload;
      })
      .addCase(fetchCertificates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default certificateSlice.reducer;
