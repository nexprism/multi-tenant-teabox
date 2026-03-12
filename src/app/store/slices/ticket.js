import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const createTicket = createAsyncThunk(
    'ticket/createTicket',
    async ({ subject, description, priority, customer, assignedTo, token, tenant }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post(
       
                { subject, description, priority, customer, assignedTo },
            );
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const ticketSlice = createSlice({
    name: 'ticket',
    initialState: {
        ticket: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createTicket.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTicket.fulfilled, (state, action) => {
                state.loading = false;
                state.ticket = action.payload;
            })
            .addCase(createTicket.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default ticketSlice.reducer;