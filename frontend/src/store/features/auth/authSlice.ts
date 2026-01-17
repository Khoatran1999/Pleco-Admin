import { createSlice } from "@reduxjs/toolkit";

// Minimal no-op auth slice retained to avoid breaking imports.
const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
