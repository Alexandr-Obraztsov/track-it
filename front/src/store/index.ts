import { configureStore } from '@reduxjs/toolkit';
import { apiReducer, apiMiddleware } from './api';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
