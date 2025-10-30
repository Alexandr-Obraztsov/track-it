import { baseApi } from './baseApi';
import type { 
  ExtractTasksResponse 
} from '../../types/api';

export const geminiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    extractTasks: builder.mutation<ExtractTasksResponse, FormData>({
      query: (formData) => {
        return {
          url: '/gemini/extract',
          method: 'POST',
          body: formData,
          // Важно: не устанавливаем Content-Type для FormData
          prepareHeaders: (headers: Headers) => {
            // Удаляем Content-Type чтобы браузер установил multipart/form-data с boundary
            headers.delete('Content-Type');
            return headers;
          },
        };
      },
      invalidatesTags: ['Task'],
    }),
  }),
});

export const { useExtractTasksMutation } = geminiApi;
