import { notificationService } from './notificationService';
import { TelegramBotService } from '../bot/telegramBot';

/**
 * Планировщик задач для уведомлений
 * Проверяет дедлайны каждую минуту
 * Проверяет ежедневные уведомления каждую минуту
 */
export class NotificationScheduler {
  private deadlineCheckInterval: NodeJS.Timeout | null = null;
  private dailyDigestInterval: NodeJS.Timeout | null = null;

  /**
   * Запускает планировщик
   */
  start(telegramBot: TelegramBotService): void {
    // Устанавливаем бота в сервис уведомлений
    notificationService.setTelegramBot(telegramBot);

    // Проверяем дедлайны каждую минуту
    this.deadlineCheckInterval = setInterval(() => {
      notificationService.checkDeadlineReminders().catch(() => {
        // Ошибка обрабатывается на уровне выше
      });
    }, 60 * 1000); // 1 минута

    // Проверяем ежедневные уведомления каждую минуту
    this.dailyDigestInterval = setInterval(() => {
      notificationService.sendDailyDigests().catch(() => {
        // Ошибка обрабатывается на уровне выше
      });
    }, 60 * 1000); // 1 минута

    // Запускаем проверки сразу при старте
    notificationService.checkDeadlineReminders().catch(() => {});
    notificationService.sendDailyDigests().catch(() => {});
  }

  /**
   * Останавливает планировщик
   */
  stop(): void {
    if (this.deadlineCheckInterval) {
      clearInterval(this.deadlineCheckInterval);
      this.deadlineCheckInterval = null;
    }

    if (this.dailyDigestInterval) {
      clearInterval(this.dailyDigestInterval);
      this.dailyDigestInterval = null;
    }

  }
}

export const notificationScheduler = new NotificationScheduler();

