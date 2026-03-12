import axiosInstance from "@/axiosConfig/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const isBrowser =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

let parsedUser = null;
if (isBrowser && localStorage.getItem("user")) {
  try {
    parsedUser = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    parsedUser = null;
    localStorage.removeItem("user"); // Optionally clear invalid value
  }
}

const initialState = {
  isAuthenticated:
    isBrowser && localStorage.getItem("accessToken") ? true : false,
  otpSended: false,
  user: parsedUser,
  loading: false,
  error: null,
};

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/user", userData);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch("/user", credentials);
      //console.log("Login Response:", response.data);
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (phone, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/request-otp", {
        phone,
      });
      //console.log("OTP sent successfully:", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/verify-otp", data);
      //console.log("OTP verification response:", response.data.data);
      if (!response.data.success) {
        throw new Error(response.data.message || "OTP verification failed");
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token found");
      }

      const response = await axiosInstance.post("/auth/refresh-token", {
        refreshToken: storedRefreshToken,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Token refresh failed");
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const getuserAddresses = createAsyncThunk(
  "auth/getuserAddresses",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/address?user=${userId}`);
      //console.log("User addresses fetched successfully:", response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createUserAddress = createAsyncThunk(
  "auth/createUserAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/address", addressData);
      //console.log("Address created successfully:", response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/user?id=${id}`, data);
      //console.log("User profile updated successfully:", response.data);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateUserAddress = createAsyncThunk(
  "auth/updateUserAddress",
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/address/${addressId}`,
        addressData
      );
      //console.log("Address updated successfully:", response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteUserAddress = createAsyncThunk(
  "auth/deleteUserAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/address/${addressId}`);
      //console.log("Address deleted successfully:", response.data);
      return addressId; // Return the address ID to remove it from the state
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/user/change-password`, data);
      //console.log("Password changed successfully:", response.data);
      return response.data.data;
    } catch (error) {
      //console.log("Error changing password: ===>", error);
      toast.error(error?.response.data?.message);
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setOtpSended: (state, action) => {
      state.otpSended = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSended = true; // Set otpSended to true when OTP is sent
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        //console.log("Verify OTP Response:", action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user; // Assuming the user data is returned in the response
        localStorage.setItem("accessToken", action.payload.tokens.accessToken);
        localStorage.setItem(
          "refreshToken",
          action.payload.tokens.refreshToken
        );
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        // Update tokens in localStorage
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Clear authentication state on refresh failure
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        //console.log("pay load is ===>", action.payload);
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setAuthenticated,
  setUser,
  setLoading,
  setError,
  logout,
  setOtpSended,
} = authSlice.actions;
export default authSlice.reducer;
