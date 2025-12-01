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
import { roleRoutes } from '../../routes/roles';
import { mockRepository } from '../mocks/database';

const app = express();
app.use(express.json());
app.use('/api/roles', roleRoutes);

describe('Roles Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/roles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        {
          id: 1,
          title: 'Developer',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          title: 'Manager',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockRepository.find.mockResolvedValue(mockRoles);

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Developer');
    });

    it('should handle database errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch roles');
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should return role by id', async () => {
      const mockRole = {
        id: 1,
        title: 'Developer',
        createdAt: new Date('2024-01-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockRole);

      const response = await request(app)
        .get('/api/roles/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.title).toBe('Developer');
    });

    it('should return 400 for invalid role id', async () => {
      const response = await request(app)
        .get('/api/roles/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid role ID');
    });

    it('should return 404 if role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/roles/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Role not found');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/roles/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch role');
    });
  });

  describe('POST /api/roles', () => {
    it('should create new role', async () => {
      const newRole = {
        id: 1,
        title: 'Developer',
        createdAt: new Date('2024-01-01'),
      };

      mockRepository.create.mockReturnValue(newRole);
      mockRepository.save.mockResolvedValue(newRole);

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Developer',
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Developer');
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    it('should return 400 if title is empty', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required and must be a non-empty string');
    });

    it('should handle database errors', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Developer',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create role');
    });
  });

  describe('PUT /api/roles/:id', () => {
    it('should update role', async () => {
      const existingRole = {
        id: 1,
        title: 'Developer',
      };

      const updatedRole = {
        ...existingRole,
        title: 'Senior Developer',
      };

      mockRepository.findOne.mockResolvedValue(existingRole);
      mockRepository.save.mockResolvedValue(updatedRole);

      const response = await request(app)
        .put('/api/roles/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Senior Developer',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Senior Developer');
    });

    it('should return 400 for invalid role id', async () => {
      const response = await request(app)
        .put('/api/roles/invalid')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid role ID');
    });

    it('should return 404 if role not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/roles/999')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Role not found');
    });

    it('should return 400 if title is empty', async () => {
      const existingRole = {
        id: 1,
        title: 'Developer',
      };

      mockRepository.findOne.mockResolvedValue(existingRole);

      const response = await request(app)
        .put('/api/roles/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title must be a non-empty string');
    });

    it('should handle database errors', async () => {
      const existingRole = {
        id: 1,
        title: 'Developer',
      };

      mockRepository.findOne.mockResolvedValue(existingRole);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/roles/1')
        .set('Authorization', 'Bearer test-token')
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to update role');
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should delete role', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/roles/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
    });

    it('should return 400 for invalid role id', async () => {
      const response = await request(app)
        .delete('/api/roles/invalid')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid role ID');
    });

    it('should return 404 if role not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const response = await request(app)
        .delete('/api/roles/999')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Role not found');
    });

    it('should handle database errors', async () => {
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/roles/1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to delete role');
    });
  });
});

