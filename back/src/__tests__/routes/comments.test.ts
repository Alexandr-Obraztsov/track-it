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
import { commentRoutes } from '../../routes/comments';
import { mockRepository, mockDataSource } from '../mocks/database';

const app = express();
app.use(express.json());
app.use('/api/comments', commentRoutes);

describe('Comments Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/comments/task/:taskId', () => {
    it('should return all comments for a task', async () => {
      const mockComments = [
        {
          id: 1,
          taskId: 1,
          userId: 1,
          content: 'Comment 1',
          edited: false,
          editedAt: null,
          createdAt: new Date('2024-01-01'),
          user: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 2,
          taskId: 1,
          userId: 2,
          content: 'Comment 2',
          edited: false,
          editedAt: null,
          createdAt: new Date('2024-01-02'),
          user: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      ];

      mockRepository.find.mockResolvedValue(mockComments);

      const response = await request(app)
        .get('/api/comments/task/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('Comment 1');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { taskId: 1 },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .get('/api/comments/task/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task id');
    });

    it('should handle database errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/comments/task/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch comments');
    });
  });

  describe('POST /api/comments', () => {
    it('should create new comment', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
      };

      const mockComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: 'New comment',
        edited: false,
        editedAt: null,
        createdAt: new Date('2024-01-01'),
      };

      const mockCommentWithUser = {
        ...mockComment,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      // Мокаем разные репозитории
      const taskRepo = { ...mockRepository };
      const commentRepo = { ...mockRepository };
      
      taskRepo.findOne = jest.fn().mockResolvedValue(mockTask);
      commentRepo.create = jest.fn().mockReturnValue(mockComment);
      commentRepo.save = jest.fn().mockResolvedValue(mockComment);
      commentRepo.findOne = jest.fn().mockResolvedValue(mockCommentWithUser);

      mockDataSource.getRepository
        .mockReturnValueOnce(taskRepo) // для Task
        .mockReturnValueOnce(commentRepo) // для TaskComment
        .mockReturnValueOnce(commentRepo); // для TaskComment (второй раз)

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 1,
          content: 'New comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('New comment');
      expect(response.body.user).toBeDefined();
    });

    it('should return 400 if taskId is missing', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'New comment',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('taskId is required');
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is required and cannot be empty');
    });

    it('should return 400 if content is empty', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 1,
          content: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is required and cannot be empty');
    });

    it('should return 400 if content is too long', async () => {
      const longContent = 'a'.repeat(10001);

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 1,
          content: longContent,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is too long (max 10000 characters)');
    });

    it('should return 404 if task not found', async () => {
      const taskRepo = { ...mockRepository };
      taskRepo.findOne = jest.fn().mockResolvedValue(null);
      // В routes/comments.ts используется getRepository(Task) один раз для проверки существования задачи
      // Затем может быть еще один вызов для TaskComment, но он не произойдет если task не найден
      mockDataSource.getRepository.mockReturnValueOnce(taskRepo);

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 999,
          content: 'New comment',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should handle database errors', async () => {
      const taskRepo = { ...mockRepository, findOne: jest.fn() };
      mockDataSource.getRepository.mockReturnValueOnce(taskRepo);
      taskRepo.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer test-token')
        .send({
          taskId: 1,
          content: 'New comment',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create comment');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update comment', async () => {
      const existingComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: 'Old comment',
        edited: false,
        editedAt: null,
        createdAt: new Date('2024-01-01'),
        user: {
          id: 1,
          firstName: 'John',
        },
      };

      const updatedComment = {
        ...existingComment,
        content: 'Updated comment',
        edited: true,
        editedAt: new Date('2024-01-02'),
      };

      mockRepository.findOne.mockResolvedValue(existingComment);
      mockRepository.save.mockResolvedValue(updatedComment);

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Updated comment');
      expect(response.body.edited).toBe(true);
    });

    it('should return 400 for invalid comment id', async () => {
      const response = await request(app)
        .put('/api/comments/invalid')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid comment id');
    });

    it('should return 400 if content is missing', async () => {
      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is required and cannot be empty');
    });

    it('should return 400 if content is empty', async () => {
      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is required and cannot be empty');
    });

    it('should return 400 if content is too long', async () => {
      const longContent = 'a'.repeat(10001);

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: longContent,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is too long (max 10000 characters)');
    });

    it('should return 404 if comment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/comments/999')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Comment not found');
    });

    it('should return 403 if user tries to edit another user comment', async () => {
      const existingComment = {
        id: 1,
        taskId: 1,
        userId: 999, // другой пользователь
        content: 'Old comment',
        edited: false,
        editedAt: null,
        createdAt: new Date('2024-01-01'),
        user: {
          id: 999,
          firstName: 'Other',
        },
      };

      mockRepository.findOne.mockResolvedValue(existingComment);

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You can only edit your own comments');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/comments/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          content: 'Updated comment',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update comment');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete comment', async () => {
      const existingComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: 'Comment to delete',
      };

      mockRepository.findOne.mockResolvedValue(existingComment);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid comment id', async () => {
      const response = await request(app)
        .delete('/api/comments/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid comment id');
    });

    it('should return 404 if comment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/comments/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Comment not found');
    });

    it('should return 403 if user tries to delete another user comment', async () => {
      const existingComment = {
        id: 1,
        taskId: 1,
        userId: 999, // другой пользователь
        content: 'Comment to delete',
      };

      mockRepository.findOne.mockResolvedValue(existingComment);

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You can only delete your own comments');
    });

    it('should handle database errors', async () => {
      const existingComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: 'Comment to delete',
      };

      mockRepository.findOne.mockResolvedValue(existingComment);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/comments/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete comment');
    });
  });
});
