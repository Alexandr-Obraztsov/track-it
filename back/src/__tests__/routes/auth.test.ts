// Моки должны быть объявлены до импортов
jest.mock('../../configs/database', () => {
  const { mockDataSource } = require('../mocks/database');
  return {
    AppDataSource: mockDataSource,
  };
});

jest.mock('@tma.js/init-data-node', () => ({
  validate: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { mockDataSource, mockRepository } from '../mocks/database';
import { validate } from '@tma.js/init-data-node';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.JWT_SECRET = 'test-secret';
    process.env.NODE_ENV = 'test';
  });

  describe('POST /api/auth/telegram', () => {
    it('should return 400 if initData is missing', async () => {
      const response = await request(app)
        .post('/api/auth/telegram')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('initData is required');
    });

    it('should return 500 if bot token is not configured', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData: 'user=%7B%22id%22%3A123456%7D' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Bot token not configured');

      process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    });

    it('should return 400 if user parameter is missing', async () => {
      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData: 'hash=test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User data not found in initData');
    });

    it('should return 400 if user data is invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData: 'user=invalid-json' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user data in initData');
    });

    it('should return 400 if user data has no id', async () => {
      const userData = encodeURIComponent(JSON.stringify({ first_name: 'Test' }));
      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData: `user=${userData}` });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User data not found in initData');
    });

    it('should create new user and return token', async () => {
      const userData = { id: 123456, first_name: 'John', last_name: 'Doe', username: 'johndoe' };
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}`;

      const createdUser = {
        id: 1,
        telegramId: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        photoUrl: null,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('test-token');
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.telegramId).toBe(123456);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { telegramId: userData.id } });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update existing user and return token', async () => {
      const userData = { id: 123456, first_name: 'John Updated', last_name: 'Doe', username: 'johndoe' };
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}`;

      const existingUser = {
        id: 1,
        telegramId: 123456,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        photoUrl: null,
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue({
        ...existingUser,
        firstName: 'John Updated',
      });
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData });

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe('John Updated');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should validate initData hash in production', async () => {
      process.env.NODE_ENV = 'production';
      const userData = { id: 123456, first_name: 'John' };
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}&hash=test-hash`;

      (validate as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid hash');
      });

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({
        id: 1,
        telegramId: 123456,
        firstName: 'John',
      });
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid initData');

      process.env.NODE_ENV = 'test';
    });

    it('should skip validation in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const userData = { id: 123456, first_name: 'John' };
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}&hash=test-hash`;

      (validate as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid hash');
      });

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({
        id: 1,
        telegramId: 123456,
        firstName: 'John',
      });
      (jwt.sign as jest.Mock).mockReturnValue('test-token');

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData });

      expect(response.status).toBe(200);

      process.env.NODE_ENV = 'test';
    });

    it('should handle database errors', async () => {
      const userData = { id: 123456, first_name: 'John' };
      const initData = `user=${encodeURIComponent(JSON.stringify(userData))}`;

      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/telegram')
        .send({ initData });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 1,
        telegramId: 123456,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        photoUrl: null,
        createdAt: new Date('2024-01-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.telegramId).toBe(123456);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: 123456 },
      });
    });

    it('should return 401 if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('User not found. Please login again.');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
