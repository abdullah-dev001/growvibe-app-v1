import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { authApi } from './api/authApi';
import { branchApi } from './api/branchApi';
import { classApi } from './api/classApi';
import { coordinatorApi } from './api/coordinator';
import { createAuthApi } from './api/createAuthApi';
import { noteApi } from './api/noteApi';
import { ownerApi } from './api/ownerApi';
import { principalApi } from './api/principalApi';
import { schoolApi } from './api/schoolApi';
import { sessionApi } from './api/sessionApi';
import { studentApi } from './api/studentApi';
import { teacherApi } from './api/teacherApi';
import authReducer from './slices/authSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  [schoolApi.reducerPath]: schoolApi.reducer,
  [branchApi.reducerPath]: branchApi.reducer,
  [createAuthApi.reducerPath]: createAuthApi.reducer,
  [teacherApi.reducerPath]: teacherApi.reducer,
  [sessionApi.reducerPath]: sessionApi.reducer,
  [ownerApi.reducerPath]: ownerApi.reducer,
  [classApi.reducerPath]: classApi.reducer,
  [principalApi.reducerPath]: principalApi.reducer,
  [studentApi.reducerPath]: studentApi.reducer,
  [coordinatorApi.reducerPath]: coordinatorApi.reducer,
  [noteApi.reducerPath]: noteApi.reducer,
});

// Persist only the auth slice of the root state
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
        authApi.middleware,
        schoolApi.middleware,
        branchApi.middleware,
        createAuthApi.middleware,
        teacherApi.middleware,
        sessionApi.middleware,
        ownerApi.middleware,
        classApi.middleware,
        principalApi.middleware,
        studentApi.middleware,
        coordinatorApi.middleware,
        noteApi.middleware,
      ),
});

export const persistor = persistStore(store);