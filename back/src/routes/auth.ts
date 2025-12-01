import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';
import { validate } from '@tma.js/init-data-node';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Эндпоинт для авторизации через Telegram WebApp
router.post('/telegram', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Парсим initData для получения данных пользователя
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const hashParam = params.get('hash');
    
    let userData: any = null;
    
    // Парсим данные пользователя
    if (userParam) {
      try {
        userData = JSON.parse(decodeURIComponent(userParam));
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid user data in initData',
          details: 'Failed to parse user parameter'
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'User data not found in initData',
        details: 'Missing user parameter in initData'
      });
    }
    
    // Валидируем initData только если есть hash (реальный запрос от Telegram)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipValidation = process.env.SKIP_INITDATA_VALIDATION === 'true';
    
    if (hashParam && !skipValidation) {
      try {
        // Валидируем initData с помощью токена бота
        validate(initData, botToken);
      } catch (error: any) {
        // В режиме разработки или если установлен флаг, пропускаем валидацию
        if (!isDevelopment && !skipValidation) {
          return res.status(401).json({ 
            error: 'Invalid initData',
            details: error.message || 'Hash validation failed. Set SKIP_INITDATA_VALIDATION=true to skip validation in development.'
          });
        }
      }
    }

    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'User data not found in initData' });
    }

    const userRepository = AppDataSource.getRepository(User);
    
    // Ищем или создаем пользователя
    let user = await userRepository.findOne({ where: { telegramId: userData.id } });
    
    if (!user) {
      user = userRepository.create({
        telegramId: userData.id,
        firstName: userData.first_name || '',
        lastName: userData.last_name || null,
        username: userData.username || null,
        photoUrl: userData.photo_url || null,
      });
      await userRepository.save(user);
    } else {
      // Обновляем данные пользователя (обновляем даже если null)
      const needsUpdate = 
        user.firstName !== (userData.first_name || '') ||
        user.lastName !== (userData.last_name || null) ||
        user.username !== (userData.username || null) ||
        user.photoUrl !== (userData.photo_url || null);

      if (needsUpdate) {
        user.firstName = userData.first_name || user.firstName;
        user.lastName = userData.last_name !== undefined ? userData.last_name : user.lastName;
        user.username = userData.username !== undefined ? userData.username : user.username;
        user.photoUrl = userData.photo_url !== undefined ? userData.photo_url : user.photoUrl;
        await userRepository.save(user);
      }
    }
    
    // Создаем JWT токен
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
      },
      token
    });
    
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Эндпоинт для получения профиля пользователя
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    // Ищем пользователя по telegramId, так как это более надежный идентификатор
    const user = await userRepository.findOne({ where: { telegramId: req.user.telegramId } });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please login again.' });
    }
    
    res.json({
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
