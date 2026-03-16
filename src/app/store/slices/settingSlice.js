import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/axiosConfig/axiosInstance";

function normalizeSetting(raw = {}) {
  try {
    const s = { ...(raw || {}) };
    const branding = s.branding || (s.setting && s.setting.branding) || null;
    if (!s.logo && branding && branding.logoUrl) {
      s.logo = branding.logoUrl;
    }
    if (!s.websiteColor && branding && branding.logoColors) {
      s.websiteColor = branding.logoColors.accent || branding.logoColors.primary || s.websiteColor;
    }
    return s;
  } catch (e) {
    return raw;
  }
}

// Async thunk to fetch settings
export const fetchSettings = createAsyncThunk(
  "setting/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/settings");
      const raw = response?.data?.setting || response?.data || {};
      const normalized = normalizeSetting(raw);
      return normalized || {};
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
      if (state.setting.loading) {
        return false;
      }
      
      // Prevent API call if cache is valid
      if (
        state.setting.settings &&
        Object.keys(state.setting.settings).length > 0 &&
        state.setting.lastFetched &&
        now - state.setting.lastFetched < CACHE_DURATION
      ) {
        return false; // Cancel the request
      }
      return true; // Proceed with the request
    }
  }
);

// Async thunk to update settings
export const updateSettings = createAsyncThunk(
  "setting/updateSettings",
  async (updatedData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put("/settings", updatedData);
      const raw = response?.data?.setting || response?.data || {};
      return normalizeSetting(raw) || {};
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const settingSlice = createSlice({
  name: "setting",
  initialState: {
    settings: {
      tenant: "",
      codLimit: 1500,
      freeShippingThreshold: 500,
      codShippingChargeBelowThreshold: 80,
      prepaidShippingChargeBelowThreshold: 40,
      repeatOrderRestrictionDays: 10,
      codOtpRequired: true,
      codDisableForHighRTO: true,
      codBlockOnRTOAddress: true,
      highRTOOrderCount: 3,
      activeHomepageLayout: null,
      codAllowed: true, // new field
      gstCharge: 0,
      paymentGatewayCharge: 0,
      categoryPaymentSettings: [],
      logo: null, // logo file path or URL
      websiteColor: "#000000", // default color
    },
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    clearSettings: (state) => {
      state.settings = {};
      state.loading = false;
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch settings";
      })

      // Update
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update settings";
      });
  },
});

export const { clearSettings } = settingSlice.actions;
export default settingSlice.reducer;
