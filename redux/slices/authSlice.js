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
  clearBranchId
  ,setSessionId
  ,clearSessionId
} = authSlice.actions;
export default authSlice.reducer;