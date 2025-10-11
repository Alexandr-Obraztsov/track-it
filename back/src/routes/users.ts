import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';

const router = Router();

// GET /api/users - получить всех пользователей
router.get('/', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      relations: ['chats', 'roles']
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['chats', 'roles']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - создать нового пользователя
router.post('/', async (req, res) => {
  try {
    const { username, firstName, lastName } = req.body;
    
    if (!username || !firstName) {
      return res.status(400).json({ error: 'Username and firstName are required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = userRepository.create({
      username,
      firstName,
      lastName: lastName || null
    });

    const savedUser = await userRepository.save(user);
    res.status(201).json(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - обновить пользователя
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.username = username || user.username;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName !== undefined ? lastName : user.lastName;

    const updatedUser = await userRepository.save(user);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - удалить пользователя
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const result = await userRepository.delete(parseInt(id));

    if (result.affected === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export const userRoutes: Router = router;
