import axios from 'axios';

// Определяем URL API
// В продакшене должен быть установлен VITE_API_URL
const getApiUrl = () => {
  // Если есть переменная окружения, используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Если мы в браузере, определяем URL автоматически
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Проверяем, это localhost или локальный IP
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.startsWith('192.168.') ||
                   hostname.startsWith('10.') ||
                   hostname.startsWith('172.');
    
    if (isLocal) {
      // Для локальной разработки используем тот же хост, но порт 3001
      return `${protocol}//${hostname}:3001/api`;
    } else {
      // В продакшене используем тот же домен для API (без порта)
      return `${protocol}//${hostname}/api`;
    }
  }
  
  // По умолчанию для разработки
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiUrl();

// Логируем URL для отладки (только в development)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
});

// Добавляем токен к каждому запросу
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем ошибки авторизации
apiClient.interceptors.response.use(
  (response) => {
    // Логируем успешные запросы
    console.log('✅ API Request:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url || '',
      status: response.status,
      baseURL: response.config.baseURL || '',
    });
    return response;
  },
  (error) => {
    // Детальное логирование ошибок
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
      response: error.response?.data,
      networkStatus: navigator.onLine ? 'online' : 'offline',
    };

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('❌ Network Error:', errorDetails);
      
      // Показываем детальную информацию об ошибке
      console.error('Network Error Details:', {
        'API URL': error.config?.baseURL + error.config?.url,
        'Method': error.config?.method,
        'Network Status': navigator.onLine ? 'Online' : 'Offline',
        'Error Code': error.code,
        'Error Message': error.message,
      });
    } else if (error.response) {
      console.error('❌ API Error:', errorDetails);
    } else {
      console.error('❌ Request Error:', errorDetails);
    }
    
    if (error.response?.status === 401) {
      // Удаляем токен только если мы не на странице логина
      if (window.location.pathname !== '/') {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Логируем исходящие запросы
apiClient.interceptors.request.use(
  (config) => {
      console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url || '',
      baseURL: config.baseURL || '',
      fullURL: (config.baseURL || '') + (config.url || ''),
      hasToken: !!config.headers.Authorization,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Setup Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;



