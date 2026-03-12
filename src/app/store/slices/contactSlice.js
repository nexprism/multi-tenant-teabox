import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

const initialState = {
  contact: null,
  loading: false,
  error: null,
};

// ✅ Fetch Contact (GET /contact)
export const fetchContact = createAsyncThunk(
  "contact/fetchContact",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/contact");
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Update Contact (PUT /contact/:id)
export const updateContact = createAsyncThunk(
  "contact/updateContact",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/contact/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data?.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ✅ Slice
const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearContactError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contact
      .addCase(fetchContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contact = action.payload;
      })
      .addCase(fetchContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update contact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contact = action.payload;
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;
