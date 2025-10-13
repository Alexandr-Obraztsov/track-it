// API Configuration
export const API_CONFIG = {
  // В development режиме используем прокси из vite.config.ts
  // В production нужно будет указать полный URL бэкенда
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  
  // Таймауты
  TIMEOUT: 10000,
  
  // Настройки для разных окружений
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    CHATS: '/chats',
    TASKS: '/tasks',
    ROLES: '/roles',
    GEMINI: '/gemini',
  }
} as const;

// Функция для получения полного URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Проверка окружения
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
