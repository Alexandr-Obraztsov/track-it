import { mockDataSource, resetMocks } from './mocks/database';

// Моки для AppDataSource
jest.mock('../configs/database', () => ({
  AppDataSource: mockDataSource,
}));

// Моки для middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: require('./mocks/middleware').mockAuthenticateToken,
}));

// Мокируем console.error чтобы не было ошибок в тестах
global.console.error = jest.fn();

// Сброс моков перед каждым тестом
beforeEach(() => {
  resetMocks();
  jest.clearAllMocks();
  (global.console.error as jest.Mock).mockClear();
});

