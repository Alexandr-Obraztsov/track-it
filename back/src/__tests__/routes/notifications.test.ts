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
import { notificationRoutes } from '../../routes/notifications';
import { mockRepository } from '../mocks/database';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notifications Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return notification settings', async () => {
      const mockSettings = {
        id: 1,
        userId: 1,
        dailyDigestTime: '09:00',
        deadlineReminderHours: [24, 12],
      };

      mockRepository.findOne.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.dailyDigestTime).toBe('09:00');
      expect(response.body.deadlineReminderHours).toEqual([24, 12]);
    });

    it('should create default settings if not found', async () => {
      const defaultSettings = {
        id: 1,
        userId: 1,
        dailyDigestTime: '09:00',
        deadlineReminderHours: [24],
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(defaultSettings);
      mockRepository.save.mockResolvedValue(defaultSettings);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.dailyDigestTime).toBe('09:00');
      expect(response.body.deadlineReminderHours).toEqual([24]);
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch notification settings');
    });
  });

  describe('PUT /api/notifications', () => {
    it('should update notification settings', async () => {
      const existingSettings = {
        id: 1,
        userId: 1,
        dailyDigestTime: '09:00',
        deadlineReminderHours: [24],
      };

      const updatedSettings = {
        ...existingSettings,
        dailyDigestTime: '10:00',
        deadlineReminderHours: [24, 12, 1],
      };

      mockRepository.findOne.mockResolvedValue(existingSettings);
      mockRepository.save.mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          dailyDigestTime: '10:00',
          deadlineReminderHours: [24, 12, 1],
        });

      expect(response.status).toBe(200);
      expect(response.body.dailyDigestTime).toBe('10:00');
      expect(response.body.deadlineReminderHours).toEqual([24, 12, 1]);
    });

    it('should create settings if not found', async () => {
      const newSettings = {
        id: 1,
        userId: 1,
        dailyDigestTime: '10:00',
        deadlineReminderHours: [24, 12],
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newSettings);
      mockRepository.save.mockResolvedValue(newSettings);

      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          dailyDigestTime: '10:00',
          deadlineReminderHours: [24, 12],
        });

      expect(response.status).toBe(200);
      expect(response.body.dailyDigestTime).toBe('10:00');
    });

    it('should return 400 if dailyDigestTime format is invalid', async () => {
      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          dailyDigestTime: '25:00',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid dailyDigestTime format. Expected HH:mm');
    });

    it('should return 400 if dailyDigestTime format is invalid (minutes)', async () => {
      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          dailyDigestTime: '09:60',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid dailyDigestTime format. Expected HH:mm');
    });

    it('should return 400 if deadlineReminderHours is not an array', async () => {
      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          deadlineReminderHours: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('deadlineReminderHours must be an array');
    });

    it('should return 400 if deadlineReminderHours contains non-positive numbers', async () => {
      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          deadlineReminderHours: [24, -1, 12],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All deadlineReminderHours must be positive numbers');
    });

    it('should return 400 if deadlineReminderHours contains non-numbers', async () => {
      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          deadlineReminderHours: [24, 'invalid', 12],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All deadlineReminderHours must be positive numbers');
    });

    it('should handle database errors', async () => {
      const existingSettings = {
        id: 1,
        userId: 1,
        dailyDigestTime: '09:00',
        deadlineReminderHours: [24],
      };

      mockRepository.findOne.mockResolvedValue(existingSettings);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/notifications')
        .set('Authorization', 'Bearer test-token')
        .send({
          dailyDigestTime: '10:00',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update notification settings');
    });
  });
});

