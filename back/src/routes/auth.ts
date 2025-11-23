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
    // Логируем запрос для отладки
    console.log('🔐 Auth request:', {
      origin: req.headers.origin || 'no origin',
      userAgent: req.headers['user-agent'] || 'no user-agent',
      hasInitData: !!req.body.initData,
      initDataLength: req.body.initData?.length || 0,
      ip: req.ip || req.socket.remoteAddress,
      timestamp: new Date().toISOString(),
    });
    
    const { initData } = req.body;
    
    if (!initData) {
      console.error('❌ Missing initData in request');
      console.error('Request body:', req.body);
      console.error('Request headers:', {
        'content-type': req.headers['content-type'],
        origin: req.headers.origin,
      });
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
        console.error('❌ Failed to parse user data:', error);
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
        console.log('✅ initData validated successfully');
      } catch (error: any) {
        console.error('❌ initData validation failed:', {
          message: error.message,
          hasHash: !!hashParam,
          hasUser: !!userParam,
          initDataLength: initData.length,
          isDevelopment,
          skipValidation,
        });
        
        // В режиме разработки или если установлен флаг, пропускаем валидацию
        if (!isDevelopment && !skipValidation) {
          return res.status(401).json({ 
            error: 'Invalid initData',
            details: error.message || 'Hash validation failed. Set SKIP_INITDATA_VALIDATION=true to skip validation in development.'
          });
        } else {
          console.warn('⚠️ Skipping initData validation (development mode or SKIP_INITDATA_VALIDATION=true)');
        }
      }
    } else {
      if (hashParam && skipValidation) {
        console.warn('⚠️ Hash present but validation skipped (SKIP_INITDATA_VALIDATION=true)');
      } else if (!hashParam) {
        console.warn('⚠️ No hash in initData - using without validation');
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
      console.log('✅ [AUTH] New user created from WebApp:', {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        hasPhotoUrl: !!user.photoUrl
      });
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
        console.log('✅ [AUTH] User updated from WebApp:', {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          hasPhotoUrl: !!user.photoUrl
        });
      }
    }
    
    // Создаем JWT токен
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      jwtSecret,
      { expiresIn: '30d' }
    );
    
    console.log('✅ Auth successful:', {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
    });

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
    console.error('❌ Telegram auth error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Эндпоинт для получения профиля
router.get('/profile', authenticateToken, async (req: any, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
