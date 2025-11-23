import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/users - получить всех пользователей (только для аутентифицированных)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      relations: ['userChatRoles', 'userTasks'],
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['userChatRoles', 'userTasks'],
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        createdAt: true,
      },
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

// PUT /api/users/:id - обновить пользователя (только свой профиль)
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Пользователь может обновлять только свой профиль
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { username, firstName, lastName, photoUrl } = req.body;
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Обновляем только переданные поля
    if (username !== undefined) user.username = username;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;

    const updatedUser = await userRepository.save(user);
    
    // Возвращаем без чувствительных данных
    res.json({
      id: updatedUser.id,
      telegramId: updatedUser.telegramId,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      photoUrl: updatedUser.photoUrl,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - удалить пользователя (только свой профиль)
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Пользователь может удалять только свой профиль
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own profile' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const result = await userRepository.delete(userId);

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
