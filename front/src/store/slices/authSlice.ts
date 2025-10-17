import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface AuthState {
  user: TelegramUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Функция для загрузки токена из localStorage
const loadTokenFromStorage = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error loading token from storage:', error);
    return null;
  }
};

// Функция для сохранения токена в localStorage
const saveTokenToStorage = (token: string): void => {
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error saving token to storage:', error);
  }
};

// Функция для удаления токена из localStorage
const removeTokenFromStorage = (): void => {
  try {
    localStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing token from storage:', error);
  }
};

const initialState: AuthState = {
  user: null,
  token: loadTokenFromStorage(),
  isAuthenticated: !!loadTokenFromStorage(),
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: TelegramUser; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      saveTokenToStorage(action.payload.token);
    },
    setUser: (state, action: PayloadAction<TelegramUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      removeTokenFromStorage();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      saveTokenToStorage(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      removeTokenFromStorage();
    },
  },
});

export const { setAuth, setUser, clearUser, setLoading, setToken, logout } = authSlice.actions;
export default authSlice.reducer;
