import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

const savedUser = localStorage.getItem('dispatch_user')
  ? JSON.parse(localStorage.getItem('dispatch_user'))
  : null;
const savedToken = localStorage.getItem('dispatch_token') || null;

export const loginUserThunk = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      const { user, accesstoken } = response.data;
      localStorage.setItem('dispatch_user', JSON.stringify(user));
      if (accesstoken) {
        localStorage.setItem('dispatch_token', accesstoken);
      }
      return { user, token: accesstoken, message: response.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return rejectWithValue(errorMsg);
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await API.post('/auth/register', { name, email, password });
      const { user, accesstoken } = response.data;
      localStorage.setItem('dispatch_user', JSON.stringify(user));
      if (accesstoken) {
        localStorage.setItem('dispatch_token', accesstoken);
      }
      return { user, token: accesstoken, message: response.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      return rejectWithValue(errorMsg);
    }
  }
);

export const logoutUserThunk = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint notice:', err.message);
    } finally {
      localStorage.removeItem('dispatch_user');
      localStorage.removeItem('dispatch_token');
    }
    return true;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: savedToken,
    isAuthenticated: !!savedUser,
    loading: false,
    error: null
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
