// Моки должны быть объявлены до импортов
jest.mock('../../configs/database', () => {
  const { mockDataSource } = require('../mocks/database');
  return {
    AppDataSource: mockDataSource,
  };
});

jest.mock('../../middleware/auth', () => ({
  authenticateToken: require('../mocks/middleware').mockAuthenticateToken,
}));

import request from 'supertest';
import express from 'express';
import { labelRoutes } from '../../routes/labels';
import { mockRepository, mockDataSource } from '../mocks/database';

const app = express();
app.use(express.json());
app.use('/api/labels', labelRoutes);

describe('Labels Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/labels/chat/:chatId', () => {
    it('should return all labels for a chat', async () => {
      const mockLabels = [
        {
          id: 1,
          chatId: 1,
          name: 'frontend',
          color: '#3B82F6',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          chatId: 1,
          name: 'backend',
          color: '#10B981',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockLabels);

      const response = await request(app)
        .get('/api/labels/chat/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('frontend');
    });

    it('should return 400 for invalid chatId', async () => {
      const response = await request(app)
        .get('/api/labels/chat/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid chatId');
    });

    it('should handle database errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/labels/chat/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch labels');
    });
  });

  describe('POST /api/labels', () => {
    it('should create new label', async () => {
      const mockChat = {
        id: 1,
        title: 'Test Chat',
      };

      const newLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const chatRepo = { ...mockRepository, findOne: jest.fn() };
      const labelRepo = { ...mockRepository, create: jest.fn(), save: jest.fn() };

      mockDataSource.getRepository
        .mockReturnValueOnce(chatRepo)
        .mockReturnValueOnce(labelRepo);

      chatRepo.findOne.mockResolvedValue(mockChat);
      labelRepo.create.mockReturnValue(newLabel);
      labelRepo.save.mockResolvedValue(newLabel);

      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 1,
          name: 'frontend',
          color: '#3B82F6',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('frontend');
      expect(response.body.color).toBeDefined();
    });

    it('should return 400 if chatId is missing', async () => {
      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'frontend',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('chatId is required');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 1,
          name: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('name is required');
    });

    it('should return 400 if color format is invalid', async () => {
      const chatRepo = { ...mockRepository };
      chatRepo.findOne = jest.fn().mockResolvedValue({ id: 1, title: 'Test Chat' });
      mockDataSource.getRepository.mockReturnValueOnce(chatRepo);

      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 1,
          name: 'frontend',
          color: 'invalid-color',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 if chat not found', async () => {
      const chatRepo = { ...mockRepository, findOne: jest.fn() };
      mockDataSource.getRepository.mockReturnValueOnce(chatRepo);
      chatRepo.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 999,
          name: 'frontend',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Chat not found');
    });

    it('should handle database errors', async () => {
      const chatRepo = { ...mockRepository, findOne: jest.fn() };
      const labelRepo = { ...mockRepository, create: jest.fn(), save: jest.fn() };

      mockDataSource.getRepository
        .mockReturnValueOnce(chatRepo)
        .mockReturnValueOnce(labelRepo);

      chatRepo.findOne.mockResolvedValue({ id: 1 });
      labelRepo.create.mockReturnValue({});
      labelRepo.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/labels')
        .set('Authorization', 'Bearer test-token')
        .send({
          chatId: 1,
          name: 'frontend',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create label');
    });
  });

  describe('PUT /api/labels/:id', () => {
    it('should update label', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      const updatedLabel = {
        ...existingLabel,
        name: 'frontend-updated',
        color: '#10B981',
      };

      mockRepository.findOne.mockResolvedValue(existingLabel);
      mockRepository.save.mockResolvedValue(updatedLabel);

      const response = await request(app)
        .put('/api/labels/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'frontend-updated',
          color: '#10B981',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('frontend-updated');
    });

    it('should return 400 for invalid label id', async () => {
      const response = await request(app)
        .put('/api/labels/invalid')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'updated',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid label id');
    });

    it('should return 404 if label not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/labels/999')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'updated',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Label not found');
    });

    it('should return 400 if name is empty', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      mockRepository.findOne.mockResolvedValue(existingLabel);

      const response = await request(app)
        .put('/api/labels/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('name must be a non-empty string');
    });

    it('should return 400 if color format is invalid', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      mockRepository.findOne.mockResolvedValue(existingLabel);

      const response = await request(app)
        .put('/api/labels/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          color: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      mockRepository.findOne.mockResolvedValue(existingLabel);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/labels/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'updated',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update label');
    });
  });

  describe('DELETE /api/labels/:id', () => {
    it('should delete label', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      const taskRepo = { ...mockRepository, update: jest.fn() };
      const labelRepo = { ...mockRepository, findOne: jest.fn(), delete: jest.fn() };

      mockDataSource.getRepository
        .mockReturnValueOnce(taskRepo)
        .mockReturnValueOnce(labelRepo);

      labelRepo.findOne.mockResolvedValue(existingLabel);
      taskRepo.update.mockResolvedValue({ affected: 0 });
      labelRepo.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/labels/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid label id', async () => {
      const response = await request(app)
        .delete('/api/labels/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid label id');
    });

    it('should return 404 if label not found', async () => {
      const labelRepo = { ...mockRepository, findOne: jest.fn() };
      mockDataSource.getRepository.mockReturnValueOnce(labelRepo);
      labelRepo.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/labels/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Label not found');
    });

    it('should handle database errors', async () => {
      const existingLabel = {
        id: 1,
        chatId: 1,
        name: 'frontend',
        color: '#3B82F6',
      };

      const taskRepo = { ...mockRepository };
      // Ошибка должна произойти в update, чтобы попасть в catch блок
      taskRepo.update = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const labelRepo = { ...mockRepository };
      labelRepo.findOne = jest.fn().mockResolvedValue(existingLabel);

      mockDataSource.getRepository
        .mockReturnValueOnce(taskRepo)
        .mockReturnValueOnce(labelRepo);

      const response = await request(app)
        .delete('/api/labels/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete label');
    });
  });
});
