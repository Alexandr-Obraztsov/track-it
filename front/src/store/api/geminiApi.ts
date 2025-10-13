import { baseApi } from './baseApi';
import type { 
  ExtractTasksRequest, 
  ExtractTasksResponse 
} from '../../types/api';

export const geminiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    extractTasks: builder.mutation<ExtractTasksResponse, ExtractTasksRequest>({
      query: (data) => ({
        url: '/gemini/extract',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const { useExtractTasksMutation } = geminiApi;
