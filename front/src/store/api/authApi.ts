import { baseApi } from './baseApi';
import type { TelegramAuthRequest, TelegramAuthResponse, ProfileResponse } from '../../types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    telegramAuth: builder.mutation<TelegramAuthResponse, TelegramAuthRequest>({
      query: (userData) => ({
        url: '/auth/telegram',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    getProfile: builder.query<ProfileResponse, void>({
      query: () => ({
        url: '/auth/profile',
        method: 'GET',
      }),
      providesTags: ['Auth'],
    }),
  }),
});

export const { useTelegramAuthMutation, useGetProfileQuery } = authApi;
