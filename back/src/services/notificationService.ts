import { AppDataSource } from '../configs/database';
import { Task } from '../entities/Task';
import { User } from '../entities/User';
import { NotificationSettings } from '../entities/NotificationSettings';
import { TelegramBotService } from '../bot/telegramBot';

export class NotificationService {
  private telegramBot: TelegramBotService | null = null;
  private taskRepository = AppDataSource.getRepository(Task);
  private userRepository = AppDataSource.getRepository(User);
  private notificationSettingsRepository = AppDataSource.getRepository(NotificationSettings);

  /**
   * Устанавливает экземпляр Telegram бота
   */
  setTelegramBot(bot: TelegramBotService): void {
    this.telegramBot = bot;
  }

  /**
   * Отправляет уведомление пользователю через Telegram
   */
  private async sendNotification(user: User, message: string): Promise<boolean> {
    if (!this.telegramBot) {
      return false;
    }

    try {
      return await this.telegramBot.sendNotification(user.telegramId, message);
    } catch (error: any) {
      return false;
    }
  }

  /**
   * Проверяет задачи с дедлайнами и отправляет уведомления
   */
  async checkDeadlineReminders(): Promise<void> {
    try {

      // Получаем всех пользователей с настройками уведомлений
      const allSettings = await this.notificationSettingsRepository.find({
        relations: ['user'],
      });

      const now = new Date();

      for (const settings of allSettings) {
        if (!settings.deadlineReminderHours || settings.deadlineReminderHours.length === 0) {
          continue;
        }

        const user = settings.user;
        if (!user) continue;

        // Получаем все активные задачи пользователя (не завершенные)
        const tasks = await this.taskRepository.find({
          where: [
            { assignedUserId: user.id, status: 'backlog' },
            { assignedUserId: user.id, status: 'in_progress' },
          ],
          relations: ['assignedUser'],
        });

        for (const task of tasks) {
          if (!task.deadline) continue;

          const deadline = new Date(task.deadline);
          const timeUntilDeadline = deadline.getTime() - now.getTime();
          const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

          // Проверяем каждое значение из deadlineReminderHours
          for (const reminderHours of settings.deadlineReminderHours) {
            // Проверяем, нужно ли отправить уведомление
            // Уведомление отправляется, если до дедлайна осталось примерно reminderHours часов
            // (с точностью до 30 минут, чтобы не пропустить момент)
            const targetTime = reminderHours;
            const timeDiff = Math.abs(hoursUntilDeadline - targetTime);

            // Отправляем уведомление, если:
            // 1. До дедлайна осталось примерно targetTime часов (с точностью до 0.5 часа)
            // 2. Дедлайн еще не наступил
            // 3. Дедлайн наступит не позже, чем через targetTime + 0.5 часа
            if (
              timeDiff <= 0.5 && 
              hoursUntilDeadline > 0 && 
              hoursUntilDeadline <= targetTime + 0.5
            ) {
              const message = this.formatDeadlineReminder(task, hoursUntilDeadline);
              await this.sendNotification(user, message);
              
              // Небольшая задержка, чтобы не перегружать API Telegram
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Прерываем цикл после отправки первого подходящего уведомления
              break;
            }
          }
        }
      }

    } catch (error) {
      // Ошибка логируется на уровне выше
    }
  }

  /**
   * Отправляет ежедневные уведомления со списком задач
   */
  async sendDailyDigests(): Promise<void> {
    try {

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Получаем всех пользователей с настройками уведомлений
      const allSettings = await this.notificationSettingsRepository.find({
        relations: ['user'],
      });

      for (const settings of allSettings) {
        const user = settings.user;
        if (!user) continue;

        // Парсим время из настроек
        const [digestHour, digestMinute] = settings.dailyDigestTime.split(':').map(Number);

        // Проверяем, наступило ли время для отправки ежедневного дайджеста
        // Отправляем, если текущее время совпадает с настройкой (с точностью до минуты)
        if (currentHour === digestHour && currentMinute === digestMinute) {
          // Получаем только задачи "в работе", которые назначены на пользователя
          const tasks = await this.taskRepository.find({
            where: {
              assignedUserId: user.id,
              status: 'in_progress',
            },
            relations: ['assignedUser', 'chat'],
            order: {
              deadline: 'ASC',
            },
          });

          if (tasks.length > 0) {
            const message = this.formatDailyDigest(tasks);
            await this.sendNotification(user, message);
          } else {
            // Отправляем сообщение, что задач в работе нет
            const message = this.formatEmptyDailyDigest();
            await this.sendNotification(user, message);
          }

          // Небольшая задержка, чтобы не перегружать API Telegram
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

    } catch (error) {
      // Ошибка логируется на уровне выше
    }
  }

  /**
   * Форматирует уведомление о приближающемся дедлайне
   */
  private formatDeadlineReminder(task: Task, hoursLeft: number): string {
    const deadline = new Date(task.deadline!);
    const deadlineStr = deadline.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let hoursText = '';
    const roundedHours = Math.round(hoursLeft);
    
    if (roundedHours <= 0) {
      hoursText = 'менее часа';
    } else if (roundedHours === 1) {
      hoursText = '1 час';
    } else if (roundedHours < 24) {
      hoursText = `${roundedHours} ${this.getHoursWord(roundedHours)}`;
    } else {
      const days = Math.floor(roundedHours / 24);
      const remainingHours = roundedHours % 24;
      if (remainingHours === 0) {
        hoursText = days === 1 ? '1 день' : `${days} ${this.getDaysWord(days)}`;
      } else {
        hoursText = `${days} ${this.getDaysWord(days)} и ${remainingHours} ${this.getHoursWord(remainingHours)}`;
      }
    }

    let message = `⏰ <b>Напоминание о дедлайне</b>\n\n`;
    message += `🎯 <b>${task.title}</b>\n`;
    
    if (task.description) {
      message += `📝 ${task.description}\n\n`;
    }
    
    message += `⏳ До дедлайна осталось: <b>${hoursText}</b>\n`;
    message += `📅 Дедлайн: <b>${deadlineStr}</b>`;

    return message;
  }

  /**
   * Возвращает правильную форму слова "час"
   */
  private getHoursWord(hours: number): string {
    const lastDigit = hours % 10;
    const lastTwoDigits = hours % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'часов';
    }
    
    if (lastDigit === 1) {
      return 'час';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return 'часа';
    } else {
      return 'часов';
    }
  }

  /**
   * Возвращает правильную форму слова "день"
   */
  private getDaysWord(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней';
    }
    
    if (lastDigit === 1) {
      return 'день';
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня';
    } else {
      return 'дней';
    }
  }

  /**
   * Форматирует ежедневный дайджест задач
   */
  private formatDailyDigest(tasks: Task[]): string {
    let message = `📋 <b>Ежедневный список задач</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🔄 <b>Задачи в работе:</b>\n\n`;

    // Группируем задачи по наличию дедлайна
    const tasksWithDeadline = tasks.filter(t => t.deadline);
    const tasksWithoutDeadline = tasks.filter(t => !t.deadline);

    if (tasksWithDeadline.length > 0) {
      for (const task of tasksWithDeadline) {
        const deadline = new Date(task.deadline!);
        const deadlineStr = deadline.toLocaleString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        
        message += `🎯 <b>${task.title}</b>\n`;
        if (task.description) {
          message += `📝 ${task.description}\n`;
        }
        message += `⏰ Дедлайн: <b>${deadlineStr}</b>\n\n`;
      }
    }

    if (tasksWithoutDeadline.length > 0) {
      for (const task of tasksWithoutDeadline) {
        message += `🎯 <b>${task.title}</b>\n`;
        if (task.description) {
          message += `📝 ${task.description}\n`;
        }
        message += `\n`;
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 Всего задач в работе: <b>${tasks.length}</b>`;

    return message;
  }

  /**
   * Форматирует сообщение, когда задач в работе нет
   */
  private formatEmptyDailyDigest(): string {
    return `📋 <b>Ежедневный список задач</b>\n` +
           `━━━━━━━━━━━━━━━━━━━━\n\n` +
           `✅ Отлично! У вас нет задач в работе.\n\n` +
           `Отдыхайте или займитесь планированием на будущее! 🎉`;
  }
}

export const notificationService = new NotificationService();

