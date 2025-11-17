import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { applicationApi } from './api/applicationApi';
import { authApi } from './api/authApi';
import { branchApi } from './api/branchApi';
import { chatApi } from './api/chatApi';
import { classApi } from './api/classApi';
import { coordinatorApi } from './api/coordinator';
import { createAuthApi } from './api/createAuthApi';
import { datesheetApi } from './api/datesheetApi';
import { diaryApi } from './api/diaryApi';
import { feeApi } from './api/feeApi';
import { leaderboardApi } from './api/leaderboardApi';
import { noteApi } from './api/noteApi';
import { ownerApi } from './api/ownerApi';
import { paymentApi } from './api/paymentApi';
import { principalApi } from './api/principalApi';
import { profileApi } from './api/profileApi';
import { resultApi } from './api/resultApi';
import { schoolApi } from './api/schoolApi';
import { sessionApi } from './api/sessionApi';
import { studentApi } from './api/studentApi';
import { taskApi } from './api/taskApi';
import { teacherApi } from './api/teacherApi';
import { ticketApi } from './api/ticketApi';
import { timetableApi } from './api/timetableApi';
import authReducer from './slices/authSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  [schoolApi.reducerPath]: schoolApi.reducer,
  [branchApi.reducerPath]: branchApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [createAuthApi.reducerPath]: createAuthApi.reducer,
  [teacherApi.reducerPath]: teacherApi.reducer,
  [sessionApi.reducerPath]: sessionApi.reducer,
  [ownerApi.reducerPath]: ownerApi.reducer,
  [classApi.reducerPath]: classApi.reducer,
  [principalApi.reducerPath]: principalApi.reducer,
  [studentApi.reducerPath]: studentApi.reducer,
  [coordinatorApi.reducerPath]: coordinatorApi.reducer,
  [noteApi.reducerPath]: noteApi.reducer,
  [diaryApi.reducerPath]: diaryApi.reducer,
  [datesheetApi.reducerPath]: datesheetApi.reducer,
  [resultApi.reducerPath]: resultApi.reducer,
  [leaderboardApi.reducerPath]: leaderboardApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [ticketApi.reducerPath]: ticketApi.reducer,
  [timetableApi.reducerPath]: timetableApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [applicationApi.reducerPath]: applicationApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [feeApi.reducerPath]: feeApi.reducer,
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
        chatApi.middleware,
        createAuthApi.middleware,
        teacherApi.middleware,
        sessionApi.middleware,
        ownerApi.middleware,
        classApi.middleware,
        principalApi.middleware,
        studentApi.middleware,
        coordinatorApi.middleware,
        noteApi.middleware,
        diaryApi.middleware,
        datesheetApi.middleware,
        resultApi.middleware,
        leaderboardApi.middleware,
        profileApi.middleware,
        ticketApi.middleware,
        timetableApi.middleware,
        paymentApi.middleware,
        applicationApi.middleware,
        taskApi.middleware,
        feeApi.middleware,
      ),
});

export const persistor = persistStore(store);