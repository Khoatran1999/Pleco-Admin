import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  supabase,
  getCurrentUser,
  getSession,
} from "../../../services/supabase";
import { API_BASE_URL } from "../../../services/api";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const signUp = createAsyncThunk(
  "auth/signUp",
  async (
    credentials: {
      email: string;
      password: string;
      username: string;
      full_name: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Sign up failed");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign up failed");
    }
  },
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Sign in failed");
      }

      // Store tokens
      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign in failed");
    }
  },
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/auth/signout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Sign out failed");
      }

      // Clear local storage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign out failed");
    }
  },
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return rejectWithValue("No access token found");
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to fetch profile");
      }

      return data.user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch profile");
    }
  },
);

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const session = await getSession();
      if (session) {
        // Fetch user profile
        const user = await dispatch(getProfile()).unwrap();
        return { user, session };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to initialize auth");
    }
  },
);

export const refreshSession = createAsyncThunk(
  "auth/refreshSession",
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return rejectWithValue("No refresh token found");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to refresh session");
      }

      // Update tokens
      if (data.session) {
        localStorage.setItem("access_token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
      }

      return data.session;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to refresh session");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign Up
    builder.addCase(signUp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signUp.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = true;
    });
    builder.addCase(signUp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Sign In
    builder.addCase(signIn.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(signIn.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = true;
    });
    builder.addCase(signIn.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Sign Out
    builder.addCase(signOut.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(signOut.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
    });
    builder.addCase(signOut.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Profile
    builder.addCase(getProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(getProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Initialize Auth
    builder.addCase(initializeAuth.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(initializeAuth.rejected, (state) => {
      state.loading = false;
      state.isAuthenticated = false;
    });

    // Refresh Session
    builder.addCase(refreshSession.fulfilled, (state, action) => {
      state.session = action.payload;
    });
    builder.addCase(refreshSession.rejected, (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
