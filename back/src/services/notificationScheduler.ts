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
    console.log('⏰ [SCHEDULER] Starting notification scheduler...');

    // Устанавливаем бота в сервис уведомлений
    notificationService.setTelegramBot(telegramBot);

    // Проверяем дедлайны каждую минуту
    this.deadlineCheckInterval = setInterval(() => {
      notificationService.checkDeadlineReminders().catch(error => {
        console.error('❌ [SCHEDULER] Error in deadline check:', error);
      });
    }, 60 * 1000); // 1 минута

    // Проверяем ежедневные уведомления каждую минуту
    this.dailyDigestInterval = setInterval(() => {
      notificationService.sendDailyDigests().catch(error => {
        console.error('❌ [SCHEDULER] Error in daily digest:', error);
      });
    }, 60 * 1000); // 1 минута

    // Запускаем проверки сразу при старте
    notificationService.checkDeadlineReminders().catch(error => {
      console.error('❌ [SCHEDULER] Error in initial deadline check:', error);
    });

    notificationService.sendDailyDigests().catch(error => {
      console.error('❌ [SCHEDULER] Error in initial daily digest:', error);
    });

    console.log('✅ [SCHEDULER] Notification scheduler started');
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

    console.log('🛑 [SCHEDULER] Notification scheduler stopped');
  }
}

export const notificationScheduler = new NotificationScheduler();

