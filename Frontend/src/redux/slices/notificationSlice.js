import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchUserCampaignsThunk = createAsyncThunk(
  'notifications/fetchUserCampaigns',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/notifications/campaigns/user/${userId}`);
      return {
        campaigns: response.data?.campaigns || [],
        stats: response.data?.stats || null
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching campaigns');
    }
  }
);

export const sendSingleEmailThunk = createAsyncThunk(
  'notifications/sendSingleEmail',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await API.post('/notifications/send-single', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error sending single email');
    }
  }
);

export const sendBulkEmailsThunk = createAsyncThunk(
  'notifications/sendBulkEmails',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await API.post('/notifications/send-bulk', payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error sending bulk campaign');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    campaigns: [],
    stats: {
      totalEmailsDispatched: 0,
      totalCampaigns: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0
    },
    loading: false,
    error: null,
    successMessage: null
  },
  reducers: {
    clearNotificationFeedback: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Campaigns
      .addCase(fetchUserCampaignsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCampaignsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload.campaigns;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
      })
      .addCase(fetchUserCampaignsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Single Email
      .addCase(sendSingleEmailThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendSingleEmailThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Notification recorded in Outbox successfully!';
      })
      .addCase(sendSingleEmailThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Bulk Emails
      .addCase(sendBulkEmailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendBulkEmailsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || 'Bulk campaign created in Outbox!';
      })
      .addCase(sendBulkEmailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearNotificationFeedback } = notificationSlice.actions;
export default notificationSlice.reducer;
