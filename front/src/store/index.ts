import { configureStore } from '@reduxjs/toolkit';
import { apiReducer, apiMiddleware } from './api';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем несериализуемые значения в RTK Query
        ignoredActions: ['api/executeMutation/rejected', 'api/executeQuery/rejected'],
        ignoredPaths: ['api.mutations', 'api.queries'],
      },
    }).concat(apiMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
