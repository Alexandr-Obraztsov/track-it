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

jest.mock('../../services/task-service/task-service', () => ({
  taskManager: {
    getChatTasks: jest.fn(),
    getTaskById: jest.fn(),
  },
  taskService: {
    getChatTasks: jest.fn(),
    getTaskById: jest.fn(),
  },
}));

jest.mock('../../services/taskHistoryService', () => ({
  taskHistoryService: {
    logCreation: jest.fn(),
    logUpdates: jest.fn(),
  },
}));

import request from 'supertest';
import express from 'express';
import { taskRoutes } from '../../routes/tasks';
import { mockRepository, mockDataSource } from '../mocks/database';
import { taskManager } from '../../services/task-service/task-service';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Tasks Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks/chat/:chatId', () => {
    it('should return tasks for a chat', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          status: 'backlog',
          chatId: 1,
        },
        {
          id: 2,
          title: 'Task 2',
          status: 'in_progress',
          chatId: 1,
        },
      ];

      (taskManager.getChatTasks as jest.Mock).mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/tasks/chat/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(taskManager.getChatTasks).toHaveBeenCalledWith(1);
    });

    it('should handle errors', async () => {
      (taskManager.getChatTasks as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tasks/chat/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch tasks');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task by id', async () => {
      const mockTask = {
        id: 1,
        title: 'Task 1',
        description: 'Description',
        status: 'backlog',
        chatId: 1,
      };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/tasks/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.title).toBe('Task 1');
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task ID');
    });

    it('should return 404 if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tasks/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tasks/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create new task', async () => {
      const mockChat = {
        id: 1,
        title: 'Test Chat',
      };

      const mockUser = {
        id: 1,
        telegramId: 123456,
        firstName: 'John',
      };

      const newTask = {
        id: 1,
        title: 'New Task',
        description: 'Description',
        status: 'backlog',
        chatId: 1,
        assignedUserId: 1,
        createdAt: new Date('2024-01-01'),
      };

      const chatRepo = { ...mockRepository };
      chatRepo.findOne = jest.fn().mockResolvedValue(mockChat);
      
      const userRepo = { ...mockRepository };
      userRepo.findOne = jest.fn().mockResolvedValue(mockUser);
      
      const taskRepo = { ...mockRepository };
      taskRepo.create = jest.fn().mockReturnValue(newTask);
      taskRepo.save = jest.fn().mockResolvedValue(newTask);
      taskRepo.findOne = jest.fn().mockResolvedValue(newTask);
      
      const chatTaskRepo = { ...mockRepository };
      chatTaskRepo.create = jest.fn().mockReturnValue({ taskId: 1, chatId: 1 });
      chatTaskRepo.save = jest.fn().mockResolvedValue({});

      // Мокаем taskHistoryService
      const { taskHistoryService } = require('../../services/taskHistoryService');
      taskHistoryService.logCreation = jest.fn().mockResolvedValue(undefined);

      mockDataSource.getRepository
        .mockReturnValueOnce(chatRepo)
        .mockReturnValueOnce(userRepo)
        .mockReturnValueOnce(taskRepo)
        .mockReturnValueOnce(chatTaskRepo)
        .mockReturnValueOnce(taskRepo); // для findOne с relations

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          description: 'Description',
          chatId: 1,
          assignedUserId: 1,
          status: 'backlog',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('New Task');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          description: 'Description',
          chatId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    it('should return 400 if title is empty', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: '   ',
          chatId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    it('should return 400 if chatId is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('chatId is required');
    });

    it('should return 400 if chatId is invalid', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          chatId: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid chatId');
    });

    it('should return 400 if status is invalid', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          chatId: 1,
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should return 404 if chat not found', async () => {
      const chatRepo = { ...mockRepository };
      chatRepo.findOne = jest.fn().mockResolvedValue(null);
      // В routes/tasks.ts сначала вызывается getRepository(Chat) для проверки существования чата
      // Если чат не найден, возвращается 404 до других вызовов
      mockDataSource.getRepository.mockReturnValueOnce(chatRepo);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          chatId: 999,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Chat not found');
    });

    it('should return 404 if assigned user not found', async () => {
      const mockChat = {
        id: 1,
        title: 'Test Chat',
      };

      const chatRepo = { ...mockRepository };
      chatRepo.findOne = jest.fn().mockResolvedValue(mockChat);
      
      const userRepo = { ...mockRepository };
      userRepo.findOne = jest.fn().mockResolvedValue(null);

      mockDataSource.getRepository
        .mockReturnValueOnce(chatRepo)
        .mockReturnValueOnce(userRepo);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          chatId: 1,
          assignedUserId: 999,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Assigned user not found');
    });

    it('should handle database errors', async () => {
      const mockChat = {
        id: 1,
        title: 'Test Chat',
      };

      const chatRepo = { ...mockRepository };
      chatRepo.findOne = jest.fn().mockResolvedValue(mockChat);
      
      const taskRepo = { ...mockRepository };
      taskRepo.create = jest.fn().mockReturnValue({});
      taskRepo.save = jest.fn().mockRejectedValue(new Error('Database error'));

      mockDataSource.getRepository
        .mockReturnValueOnce(chatRepo)
        .mockReturnValueOnce(taskRepo);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'New Task',
          chatId: 1,
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create task');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task', async () => {
      const existingTask = {
        id: 1,
        title: 'Old Task',
        description: 'Old Description',
        status: 'backlog',
        chatId: 1,
      };

      const updatedTask = {
        ...existingTask,
        title: 'Updated Task',
        description: 'Updated Description',
      };

      mockRepository.findOne.mockResolvedValueOnce(existingTask); // для Task
      mockRepository.findOne.mockResolvedValueOnce(existingTask); // для Task (второй раз)
      mockRepository.save.mockResolvedValue(updatedTask);

      const response = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated Task',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Task');
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .put('/api/tasks/invalid')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task ID');
    });

    it('should return 404 if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tasks/999')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 if status is invalid', async () => {
      const existingTask = {
        id: 1,
        title: 'Task',
        status: 'backlog',
      };

      mockRepository.findOne.mockResolvedValue(existingTask);

      const response = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should handle database errors', async () => {
      const existingTask = {
        id: 1,
        title: 'Task',
        status: 'backlog',
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update task');
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('should update task status', async () => {
      const existingTask = {
        id: 1,
        title: 'Task',
        status: 'backlog',
        assignedUserId: null,
      };

      const updatedTask = {
        ...existingTask,
        status: 'in_progress',
        assignedUserId: 1,
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.save.mockResolvedValue(updatedTask);

      const response = await request(app)
        .patch('/api/tasks/1/status')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'in_progress',
          assignedUserId: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .patch('/api/tasks/invalid/status')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'in_progress',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task ID');
    });

    it('should return 400 if status is missing', async () => {
      const response = await request(app)
        .patch('/api/tasks/1/status')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Status is required');
    });

    it('should return 400 if status is invalid', async () => {
      const response = await request(app)
        .patch('/api/tasks/1/status')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'invalid-status',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should return 404 if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/tasks/999/status')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'in_progress',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should handle database errors', async () => {
      const existingTask = {
        id: 1,
        title: 'Task',
        status: 'backlog',
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/api/tasks/1/status')
        .set('Authorization', 'Bearer test-token')
        .send({
          status: 'in_progress',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update status');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task', async () => {
      const existingTask = {
        id: 1,
        title: 'Task to delete',
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/tasks/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .delete('/api/tasks/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task ID');
    });

    it('should return 404 if task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/tasks/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should handle database errors', async () => {
      const existingTask = {
        id: 1,
        title: 'Task',
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/tasks/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete task');
    });
  });
});
