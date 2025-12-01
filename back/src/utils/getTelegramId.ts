import { Request } from 'express';

/**
 * Получает telegramId из заголовка X-Telegram-Id или из initData
 */
export const getTelegramId = (req: Request): number | null => {
  // Пробуем получить напрямую из заголовка
  const telegramIdHeader = req.headers['x-telegram-id'];
  if (telegramIdHeader) {
    const telegramId = parseInt(telegramIdHeader as string);
    if (!isNaN(telegramId)) {
      return telegramId;
    }
  }

  // Если нет в заголовке, пробуем из initData
  const initData = req.headers['x-telegram-init-data'] as string;
  if (initData) {
    try {
      const params = new URLSearchParams(initData);
      const userParam = params.get('user');
      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        if (userData?.id) {
          return userData.id;
        }
      }
    } catch (error) {
      // Игнорируем ошибки парсинга
    }
  }

  return null;
};

