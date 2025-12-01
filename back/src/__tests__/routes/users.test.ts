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
import { userRoutes } from '../../routes/users';
import { mockRepository } from '../mocks/database';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          telegramId: 123456,
          username: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          photoUrl: null,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          telegramId: 789012,
          username: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          photoUrl: null,
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(1);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch users');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        telegramId: 123456,
        username: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        photoUrl: null,
        createdAt: new Date('2024-01-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['userChatRoles', 'userTasks'],
        select: expect.any(Object),
      });
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .get('/api/users/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });

    it('should return 404 if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch user');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user profile', async () => {
      const existingUser = {
        id: 1,
        telegramId: 123456,
        username: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        photoUrl: null,
      };

      const updatedUser = {
        ...existingUser,
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          firstName: 'John Updated',
          lastName: 'Doe Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('John Updated');
      expect(response.body.lastName).toBe('Doe Updated');
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .put('/api/users/invalid')
        .set('Authorization', 'Bearer test-token')
        .send({ firstName: 'John' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });

    it('should return 403 if user tries to update another user', async () => {
      const response = await request(app)
        .put('/api/users/999')
        .set('Authorization', 'Bearer test-token')
        .send({ firstName: 'John' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You can only update your own profile');
    });

    it('should return 404 if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer test-token')
        .send({ firstName: 'John' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      const existingUser = {
        id: 1,
        telegramId: 123456,
        firstName: 'John',
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', 'Bearer test-token')
        .send({ firstName: 'John Updated' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update user');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user profile', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should return 400 for invalid user id', async () => {
      const response = await request(app)
        .delete('/api/users/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid user ID');
    });

    it('should return 403 if user tries to delete another user', async () => {
      const response = await request(app)
        .delete('/api/users/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You can only delete your own profile');
    });

    it('should return 404 if user not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle database errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete user');
    });
  });
});

