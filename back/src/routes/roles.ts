import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { Role } from '../entities/Role';

const router = Router();

// GET /api/roles - получить все роли
router.get('/', async (req, res) => {
  try {
    const roleRepository = AppDataSource.getRepository(Role);
    const roles = await roleRepository.find({
      relations: ['users', 'chats']
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/roles/:id - получить роль по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    const role = await roleRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['users', 'chats']
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /api/roles - создать новую роль
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const roleRepository = AppDataSource.getRepository(Role);
    const role = roleRepository.create({
      title
    });

    const savedRole = await roleRepository.save(role);
    res.status(201).json(savedRole);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - обновить роль
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    const roleRepository = AppDataSource.getRepository(Role);
    const role = await roleRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    role.title = title || role.title;

    const updatedRole = await roleRepository.save(role);
    res.json(updatedRole);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - удалить роль
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    const result = await roleRepository.delete(parseInt(id));

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

export const roleRoutes: Router = router;
