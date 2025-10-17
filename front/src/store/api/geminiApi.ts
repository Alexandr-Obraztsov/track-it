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
          // Не устанавливаем Content-Type - браузер сделает это автоматически для FormData
          prepareHeaders: (headers: Headers) => {
            // Удаляем Content-Type если он есть, чтобы браузер установил правильный с boundary
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
