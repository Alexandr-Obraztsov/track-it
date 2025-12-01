import { Request, Response, NextFunction } from 'express';
import { validate } from '@tma.js/init-data-node';
import { AppDataSource } from '../configs/database';
import { User } from '../entities/User';

export interface TelegramAuthRequest extends Request {
  telegramId?: number;
}

/**
 * Middleware для извлечения telegramId из initData
 * Автоматически создает/обновляет пользователя в базе данных
 */
export const extractTelegramUser = async (
  req: TelegramAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Получаем initData из заголовка
    const initData = req.headers['x-telegram-init-data'] as string;

    if (!initData) {
      return res.status(401).json({ error: 'Telegram initData required' });
    }

    // Парсим initData
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');
    const hashParam = params.get('hash');

    if (!userParam) {
      return res.status(400).json({ error: 'User data not found in initData' });
    }

    let userData: any;
    try {
      userData = JSON.parse(decodeURIComponent(userParam));
    } catch (error) {
      return res.status(400).json({ error: 'Invalid user data in initData' });
    }

    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'Invalid user data: missing id' });
    }

    // Валидируем initData (только если есть hash и не пропущена валидация)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const skipValidation = process.env.SKIP_INITDATA_VALIDATION === 'true';

    if (hashParam && botToken && !skipValidation) {
      try {
        validate(initData, botToken);
      } catch (error: any) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (!isDevelopment) {
          return res.status(401).json({
            error: 'Invalid initData',
            details: error.message || 'Hash validation failed'
          });
        }
      }
    }

    // Создаем или обновляем пользователя в базе данных
    const userRepository = AppDataSource.getRepository(User);
    let user = await userRepository.findOne({ where: { telegramId: userData.id } });

    if (!user) {
      // Создаем нового пользователя
      user = userRepository.create({
        telegramId: userData.id,
        firstName: userData.first_name || '',
        lastName: userData.last_name || undefined,
        username: userData.username || undefined,
        photoUrl: userData.photo_url || undefined,
      });
      await userRepository.save(user);
    } else {
      // Обновляем существующего пользователя
      user.firstName = userData.first_name || user.firstName || '';
      user.lastName = userData.last_name !== undefined ? userData.last_name : user.lastName;
      user.username = userData.username !== undefined ? userData.username : user.username;
      user.photoUrl = userData.photo_url !== undefined ? userData.photo_url : user.photoUrl;
      await userRepository.save(user);
    }

    // Сохраняем telegramId в request
    req.telegramId = userData.id;

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to extract Telegram user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

