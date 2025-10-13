import { Router } from 'express';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';
import crypto from 'crypto-js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

function verifyTelegramAuth(authData: any, botToken: string): { isValid: boolean; error?: string } {
  const { hash, auth_date, ...userData } = authData;
  
  // Проверяем время авторизации (не старше 24 часов)
  const currentTime = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 часа в секундах
  
  if (currentTime - auth_date > maxAge) {
    return { 
      isValid: false, 
      error: `Auth data is too old. Age: ${Math.floor((currentTime - auth_date) / 3600)} hours` 
    };
  }
  
  // Создаем строку для проверки подписи
  const dataCheckString = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  
  // Создаем секретный ключ
  const secretKey = crypto.HmacSHA256(botToken, 'WebAppData').toString();
  
  // Вычисляем хеш
  const calculatedHash = crypto.HmacSHA256(dataCheckString, secretKey).toString();
  
  if (calculatedHash !== hash) {
    return { 
      isValid: false, 
      error: 'Invalid signature' 
    };
  }
  
  return { isValid: true };
}

// Эндпоинт для авторизации через Telegram
router.post('/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    console.log('Telegram auth request:', {
      id,
      first_name,
      username,
      auth_date: new Date(auth_date * 1000).toISOString(),
      hash: hash ? `${hash.substring(0, 8)}...` : 'none'
    });
    
    // Проверяем подпись и время авторизации
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: 'Bot token not configured' });
      }
      
      const verification = verifyTelegramAuth(req.body, botToken);
      if (!verification.isValid) {
        return res.status(401).json({ error: verification.error });
      }
    } else {
      // В режиме разработки проверяем только время авторизации
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 24 * 60 * 60; // 24 часа
      
      if (currentTime - auth_date > maxAge) {
        return res.status(401).json({ 
          error: `Auth data is too old. Age: ${Math.floor((currentTime - auth_date) / 3600)} hours` 
        });
      }
    }
    
    const userRepository = AppDataSource.getRepository(User);
    
    // Ищем или создаем пользователя
    let user = await userRepository.findOne({ where: { telegramId: id } });
    
    if (!user) {
      user = userRepository.create({
        telegramId: id,
        firstName: first_name,
        lastName: last_name,
        username: username,
        photoUrl: photo_url,
      });
      await userRepository.save(user);
    } else {
      // Обновляем данные пользователя
      user.firstName = first_name;
      user.lastName = last_name;
      user.username = username;
      user.photoUrl = photo_url;
      await userRepository.save(user);
    }
    
    // Создаем JWT токен
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, telegramId: id },
      jwtSecret,
      { expiresIn: '30d' }
    );
    
    res.json({
      user: {
        id: user.telegramId,
        first_name: user.firstName,
        last_name: user.lastName,
        username: user.username,
        photo_url: user.photoUrl,
        auth_date: auth_date,
        hash: hash
      },
      token
    });
    
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      id: user.telegramId,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      photo_url: user.photoUrl,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
