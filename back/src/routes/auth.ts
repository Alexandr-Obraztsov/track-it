import { Router, Request } from 'express';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';
import { getTelegramId } from '../utils/getTelegramId';

const router: Router = Router();

// Эндпоинт для получения/создания профиля пользователя
router.get('/profile', async (req: Request, res) => {
  console.log('🔐 GET /auth/profile - Request received');
  console.log('📋 Headers:', {
    'x-telegram-init-data': req.headers['x-telegram-init-data'] ? 'present' : 'missing',
    'x-telegram-id': req.headers['x-telegram-id'] || 'missing',
    'origin': req.headers.origin,
  });

  try {
    const telegramId = getTelegramId(req);
    console.log('👤 Extracted telegramId:', telegramId);
    
    if (!telegramId) {
      console.error('❌ No telegramId found in request');
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { telegramId } });
    console.log('👤 User found in DB:', user ? 'yes' : 'no');
    
    // Если пользователя нет, создаем его из initData
    if (!user) {
      console.log('🆕 Creating new user...');
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('❌ Init data required for new user but not provided');
        return res.status(400).json({ error: 'Init data required for new user' });
      }

      try {
        const params = new URLSearchParams(initData);
        const userParam = params.get('user');
        if (!userParam) {
          console.error('❌ User data not found in initData');
          return res.status(400).json({ error: 'User data not found in initData' });
        }

        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('📝 User data from initData:', {
          id: userData.id,
          first_name: userData.first_name,
          username: userData.username,
        });

        user = userRepository.create({
          telegramId,
          firstName: userData.first_name || '',
          lastName: userData.last_name || undefined,
          username: userData.username || undefined,
          photoUrl: userData.photo_url || undefined,
        });
        await userRepository.save(user);
        console.log('✅ New user created successfully');
      } catch (error) {
        console.error('❌ Error creating user:', error);
        return res.status(400).json({ error: 'Invalid initData' });
      }
    }
    
    const response = {
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      createdAt: user.createdAt.toISOString(),
    };
    
    console.log('✅ Profile response:', { telegramId: response.telegramId, firstName: response.firstName });
    res.json(response);
  } catch (error) {
    console.error('❌ Error in /auth/profile:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
