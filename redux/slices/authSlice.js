import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  sessionRestored: false,
  schoolId: null,
  branchId: null,
  sessionId: null,
  classId: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.schoolId = null;
      state.branchId = null;
      state.sessionId = null;
      state.classId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSessionRestored: (state, action) => {
      state.sessionRestored = action.payload;
    },
    setSchoolId: (state, action) => {
      state.schoolId = action.payload;
    },
    setBranchId: (state, action) => {
      state.branchId = action.payload;
    },
    clearBranchId: (state) => {
      state.branchId = null;
    },
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    clearSessionId: (state) => {
      state.sessionId = null;
    },
    setClassId: (state, action) => {
      state.classId = action.payload;
    },
    clearClassId: (state) => {
      state.classId = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.schoolId = null;
      state.branchId = null;
      state.sessionId = null;
      state.classId = null;
    },
    setAuth: (state, action) => {
      // Process Supabase auth response
      const authData = action.payload;
      if (authData?.user) {
        state.user = {
          id: authData.user.id,
          email: authData.user.email,
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          role: authData.user.app_metadata?.role,
        };
        state.isAuthenticated = true;
        state.error = null;
      }
    },
  },
});

export const { 
  setUser, 
  setLoading, 
  setError, 
  logout, 
  clearError, 
  setSessionRestored,
  setSchoolId,
  setBranchId,
  clearBranchId,
  setSessionId,
  clearSessionId,
  setClassId,
  clearClassId,
  clearAuth,
  setAuth
} = authSlice.actions;
export default authSlice.reducer;