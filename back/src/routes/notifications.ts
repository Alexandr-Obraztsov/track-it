import { Router, Request } from 'express';
import { AppDataSource } from '../configs/database';
import { NotificationSettings } from '../entities/NotificationSettings';
import { getTelegramId } from '../utils/getTelegramId';

const router = Router();

// GET /api/notifications - получить настройки уведомлений текущего пользователя
router.get('/', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const notificationSettingsRepository = AppDataSource.getRepository(NotificationSettings);
    
    let settings = await notificationSettingsRepository.findOne({
      where: { telegramId },
    });

    // Если настроек нет, создаем дефолтные
    if (!settings) {
      settings = notificationSettingsRepository.create({
        telegramId,
        dailyDigestTime: '09:00',
        deadlineReminderHours: [24],
      });
      await notificationSettingsRepository.save(settings);
    }

    res.json({
      dailyDigestTime: settings.dailyDigestTime,
      deadlineReminderHours: settings.deadlineReminderHours || [24],
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// PUT /api/notifications - обновить настройки уведомлений
router.put('/', async (req: Request, res) => {
  try {
    const telegramId = getTelegramId(req);
    if (!telegramId) {
      return res.status(401).json({ error: 'Telegram ID required' });
    }

    const { dailyDigestTime, deadlineReminderHours } = req.body;

    // Валидация
    if (dailyDigestTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(dailyDigestTime)) {
      return res.status(400).json({ error: 'Invalid dailyDigestTime format. Expected HH:mm' });
    }

    if (deadlineReminderHours && !Array.isArray(deadlineReminderHours)) {
      return res.status(400).json({ error: 'deadlineReminderHours must be an array' });
    }

    if (deadlineReminderHours && deadlineReminderHours.some((h: any) => typeof h !== 'number' || h <= 0)) {
      return res.status(400).json({ error: 'All deadlineReminderHours must be positive numbers' });
    }

    const notificationSettingsRepository = AppDataSource.getRepository(NotificationSettings);
    
    let settings = await notificationSettingsRepository.findOne({
      where: { telegramId },
    });

    if (!settings) {
      // Создаем новые настройки, если их нет
      settings = notificationSettingsRepository.create({
        telegramId,
        dailyDigestTime: dailyDigestTime || '09:00',
        deadlineReminderHours: deadlineReminderHours || [24],
      });
    } else {
      // Обновляем существующие настройки
      if (dailyDigestTime !== undefined) {
        settings.dailyDigestTime = dailyDigestTime;
      }
      if (deadlineReminderHours !== undefined) {
        settings.deadlineReminderHours = deadlineReminderHours;
      }
    }

    await notificationSettingsRepository.save(settings);

    res.json({
      dailyDigestTime: settings.dailyDigestTime,
      deadlineReminderHours: settings.deadlineReminderHours,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export const notificationRoutes: Router = router;

