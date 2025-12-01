import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { messageProcessor } from '../services/messageProcessor';
import { userManager } from '../services/userManager';
import { Formatter } from '../utils/formatter';

// Загружаем переменные окружения
dotenv.config();

export class TelegramBotService {
  private bot: TelegramBot;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  private setupHandlers() {
    // Обработчик новых участников группы (включая добавление бота)
    this.bot.on('new_chat_members', async (msg) => {
      if (!msg.new_chat_members || msg.new_chat_members.length === 0) {
        return;
      }


      // Всегда создаем или получаем чат
      let chat;
      try {
        chat = await userManager.getOrCreateChat(msg.chat, msg.message_id);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error ensuring chat:', error);
        return; // Не продолжаем, если не удалось создать чат
      }

      // Обрабатываем каждого нового участника
      for (const newMember of msg.new_chat_members) {
        try {
          // Создаем пользователя (даже если это бот - для полноты данных)
          const { user, isNewUser } = await userManager.getOrCreateUser(newMember);
          
          // Пропускаем ботов для приветственного сообщения
          if (newMember.is_bot) {
            continue;
          }

          // Отправляем приветственное сообщение только новым пользователям
          if (isNewUser && chat) {
            const welcomeMessage = 
              `👋 <b>Привет, ${newMember.first_name || 'пользователь'}!</b>\n\n` +
              `Я бот для управления задачами. Теперь ты зарегистрирован в системе!\n\n` +
              `💡 <b>Как использовать:</b>\n` +
              `• В личном чате просто отправляй сообщения - я автоматически создам задачи\n` +
              `• В группе отвечай на сообщения командой /check для создания задач\n` +
              `• Используй /tasks для просмотра списка задач\n` +
              `• Используй /users для просмотра участников группы`;
            
            try {
              await this.sendMessage(msg.chat.id, welcomeMessage);
            } catch (error) {
              console.error('❌ [TELEGRAM] Error sending welcome message:', error);
            }
          }
        } catch (error) {
          console.error('❌ [TELEGRAM] Error handling new chat member:', {
            memberId: newMember.id,
            memberName: newMember.first_name,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    });


    // Обработчик команды /users - показывает участников группы, которых знает бот
    this.bot.onText(/^\/users(@\w+)?$/, async (msg) => {

      try {
        // Всегда создаем пользователя и чат
        if (msg.from) {
          await userManager.getOrCreateUser(msg.from);
        }
        const chat = await userManager.getOrCreateChat(msg.chat, msg.message_id);

        if (msg.chat.type === 'private') {
          await this.sendMessage(msg.chat.id, 'ℹ️ Эта команда доступна только в групповых чатах');
          return;
        }
        
        // Получаем пользователей из userChatRoles (те, у кого есть роли в чате)
        const chatUsersFromRoles = await userManager.getChatUsers(chat.id);
        
        // Также получаем задачи чата для поиска пользователей, назначенных на задачи
        const { taskService } = await import('../services/task-service/task-service');
        const chatTasks = await taskService.getChatTasks(chat.id);
        
        // Собираем уникальных пользователей
        const userIds = new Set<number>();
        
        // Добавляем пользователей из ролей
        chatUsersFromRoles.forEach(user => userIds.add(user.telegramId));
        
        // Добавляем пользователей, назначенных на задачи
        chatTasks.forEach(task => {
          if (task.assignedUser) {
            userIds.add(task.assignedUser.telegramId);
          }
        });

        if (userIds.size === 0) {
          await this.sendMessage(
            msg.chat.id,
            '👥 <b>Участники группы</b>\n━━━━━━━━━━━━━━━━━━━━\n\n' +
            '🤷‍♂️ Пока никого нет в базе. Участники добавятся автоматически при:\n' +
            '• Добавлении бота в группу\n' +
            '• Обработке сообщений через /check\n' +
            '• Назначении задач на участников'
          );
          return;
        }

        // Получаем информацию о пользователях
        const users = await Promise.all(
          Array.from(userIds).map(id => userManager.getUserById(id))
        );
        const validUsers = users.filter((u): u is NonNullable<typeof u> => u !== null);

        let message = '👥 <b>Участники группы</b>\n';
        message += '━━━━━━━━━━━━━━━━━━━━\n\n';

        if (validUsers.length === 0) {
          message += '🤷‍♂️ Пока никого нет в базе.';
        } else {
          validUsers.forEach((user, index) => {
            if (user) {
              const displayName = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
              const username = user.username ? `@${user.username}` : `ID: ${user.telegramId}`;
              message += `${index + 1}. ${displayName} (${username})\n`;
            }
          });
        }

        message += '\n━━━━━━━━━━━━━━━━━━━━\n';
        message += `📊 <i>Всего: ${validUsers.length}</i>`;

        await this.sendMessage(msg.chat.id, message);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error handling /users command:', error);
        try {
          await this.sendMessage(msg.chat.id, 'Произошла ошибка при получении списка участников');
        } catch (sendError) {
          console.error('❌ [TELEGRAM] Error sending error message:', sendError);
        }
      }
    });

    // Обработчик команды /tasks
    // Регулярное выражение учитывает как /tasks, так и /tasks@bot_username
    this.bot.onText(/^\/tasks(@\w+)?$/, async (msg) => {
      try {
        // Всегда создаем пользователя и чат перед обработкой команды
        if (msg.from) {
          await userManager.getOrCreateUser(msg.from);
        }
        await userManager.getOrCreateChat(msg.chat, msg.message_id);

        const result = await messageProcessor.handleTasksCommand(msg);
        if (result.success && result.responseMessage) {
          await this.sendMessage(msg.chat.id, result.responseMessage);
        } else {
          const errorMessage = result.error || 'Произошла ошибка при получении списка задач';
          await this.sendMessage(msg.chat.id, `❌ ${errorMessage}`);
        }
      } catch (error) {
        console.error('❌ [TELEGRAM] Error handling /tasks command:', error);
        await this.bot.sendMessage(msg.chat.id, 'Произошла ошибка при получении списка задач');
      }
    });

    // Обработчик команды /check для обработки reply-сообщений в группах
    // Регулярное выражение учитывает как /check, так и /check@bot_username
    this.bot.onText(/^\/check(@\w+)?$/, async (msg) => {
      // Проверяем, что команда используется как reply на сообщение
      if (!msg.reply_to_message) {
        try {
          await this.sendMessage(
            msg.chat.id, 
            '⚠️ Эта команда должна быть использована как ответ на сообщение. Ответьте на сообщение командой /check'
          );
        } catch (error) {
          console.error('❌ [TELEGRAM] Error sending /check usage hint:', error);
        }
        return;
      }

      // Получаем исходное сообщение, на которое был reply
      const originalMessage = msg.reply_to_message;

      // Проверяем, что исходное сообщение не системное
      if (this.isSystemMessage(originalMessage)) {
        try {
          await this.sendMessage(msg.chat.id, '⚠️ Нельзя обработать системное сообщение');
        } catch (error) {
          console.error('❌ [TELEGRAM] Error sending system message warning:', error);
        }
        return;
      }

      // Проверяем, что у исходного сообщения есть отправитель
      if (!originalMessage.from) {
        try {
          await this.sendMessage(msg.chat.id, '⚠️ Не удалось определить отправителя сообщения');
        } catch (error) {
          console.error('❌ [TELEGRAM] Error sending sender warning:', error);
        }
        return;
      }

      // Всегда создаем пользователя и чат перед обработкой
      try {
        await userManager.getOrCreateUser(msg.from!); // Пользователь, отправивший команду
        await userManager.getOrCreateUser(originalMessage.from); // Пользователь, написавший сообщение
        await userManager.getOrCreateChat(msg.chat, msg.message_id);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error ensuring user/chat for /check:', error);
      }

      // Обрабатываем исходное сообщение
      try {
        await this.handleMessage(originalMessage, false); // Не показываем welcome, так как это группа
      } catch (error) {
        console.error('❌ [TELEGRAM] Error handling /check reply message:', error);
        try {
          await this.sendMessage(msg.chat.id, 'Произошла ошибка при обработке сообщения');
        } catch (sendError) {
          console.error('❌ [TELEGRAM] Error sending error message:', sendError);
        }
      }
    });

    // Универсальный обработчик всех сообщений (исключая команды)
    this.bot.on('message', async (msg) => {
      // Обрабатываем системные сообщения о создании группы ПЕРЕД проверкой на системные сообщения
      if (msg.group_chat_created || msg.supergroup_chat_created || msg.channel_chat_created) {
        try {
          const chat = await userManager.getOrCreateChat(msg.chat, msg.message_id);
          
          // Если есть отправитель, создаем и его
          if (msg.from) {
            await userManager.getOrCreateUser(msg.from);
          }
        } catch (error) {
          console.error('❌ [TELEGRAM] Error handling group creation:', error);
        }
        return; // Не обрабатываем дальше как обычное сообщение
      }

      // Пропускаем команды - они обрабатываются отдельными обработчиками
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      // Пропускаем остальные системные сообщения (добавление/удаление участников, изменение группы и т.д.)
      if (this.isSystemMessage(msg)) {
        return;
      }

      // Пропускаем сообщения без отправителя (должно быть редко, но возможно в некоторых случаях)
      if (!msg.from) {
        // Но все равно создаем/обновляем чат, даже если нет отправителя
        try {
          await userManager.getOrCreateChat(msg.chat, msg.message_id);
        } catch (error) {
          console.error('❌ [TELEGRAM] Error ensuring chat for message without sender:', error);
        }
        return;
      }

      // Всегда создаем/обновляем пользователя и чат для любого сообщения
      // Это нужно делать ДО проверки на ботов и тип чата, чтобы данные всегда были в базе
      try {
        await userManager.getOrCreateUser(msg.from);
        await userManager.getOrCreateChat(msg.chat, msg.message_id);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error ensuring user/chat for message:', error);
      }

      // Пропускаем сообщения от других ботов (но не от самого себя)
      if (msg.from.is_bot) {
        return;
      }

      // В групповых чатах игнорируем обычные сообщения - обрабатываем только через /check
      if (msg.chat.type !== 'private') {
        return;
      }

      // В личных чатах обрабатываем все сообщения автоматически
      try {
        // Пользователь и чат уже созданы выше для всех сообщений
        // Просто обрабатываем сообщение
        await this.handleMessage(msg, true);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error handling message:', error);
        try {
          await this.sendMessage(msg.chat.id, 'Произошла ошибка при обработке сообщения');
        } catch (sendError) {
          console.error('❌ [TELEGRAM] Error sending error message:', sendError);
        }
      }
    });

    // Обработчик ошибок
    this.bot.on('error', (error) => {
      console.error('❌ [TELEGRAM] Bot error:', error);
    });

    // Обработчик polling ошибок
    this.bot.on('polling_error', (error) => {
      console.error('❌ [TELEGRAM] Polling error:', error);
    });
  }

  private getMessageType(msg: TelegramBot.Message): string {
    if (msg.text) return 'text';
    if (msg.voice) return 'voice';
    if (msg.audio) return 'audio';
    if (msg.photo) return 'photo';
    if (msg.video) return 'video';
    if (msg.document) return 'document';
    if (msg.sticker) return 'sticker';
    if (msg.contact) return 'contact';
    if (msg.location) return 'location';
    if (msg.venue) return 'venue';
    if (msg.animation) return 'animation';
    if (msg.video_note) return 'video_note';
    return 'unknown';
  }

  /**
   * Проверяет, является ли сообщение системным
   */
  private isSystemMessage(msg: TelegramBot.Message): boolean {
    return !!(
      msg.new_chat_members ||
      msg.left_chat_member ||
      msg.new_chat_title ||
      msg.new_chat_photo ||
      msg.delete_chat_photo ||
      msg.group_chat_created ||
      msg.supergroup_chat_created ||
      msg.channel_chat_created ||
      msg.migrate_to_chat_id ||
      msg.migrate_from_chat_id ||
      msg.pinned_message ||
      (msg as any).user_shared ||
      (msg as any).chat_shared
    );
  }

  /**
   * Определяет тип системного сообщения для логирования
   */
  private getSystemMessageType(msg: TelegramBot.Message): string {
    if (msg.new_chat_members) return 'new_chat_members';
    if (msg.left_chat_member) return 'left_chat_member';
    if (msg.new_chat_title) return 'new_chat_title';
    if (msg.new_chat_photo) return 'new_chat_photo';
    if (msg.delete_chat_photo) return 'delete_chat_photo';
    if (msg.group_chat_created) return 'group_chat_created';
    if (msg.supergroup_chat_created) return 'supergroup_chat_created';
    if (msg.channel_chat_created) return 'channel_chat_created';
    if (msg.migrate_to_chat_id) return 'migrate_to_chat_id';
    if (msg.migrate_from_chat_id) return 'migrate_from_chat_id';
    if (msg.pinned_message) return 'pinned_message';
    return 'unknown_system';
  }

  private async handleMessage(msg: TelegramBot.Message, showWelcomeMessage: boolean = true) {
    // Дополнительная проверка на наличие отправителя
    if (!msg.from) {
      return;
    }

    // Всегда создаем пользователя и чат (уже созданы выше, но на всякий случай)
    try {
      const { isNewUser } = await userManager.getOrCreateUser(msg.from);
      await userManager.getOrCreateChat(msg.chat, msg.message_id);

      // Показываем приветственное сообщение только новым пользователям в личных чатах
      if (showWelcomeMessage && isNewUser && msg.chat.type === 'private') {
        const welcomeMessage = `👋 Привет, ${msg.from.first_name || 'пользователь'}! Я бот для управления задачами.\n\n` +
          `Я буду автоматически создавать задачи из твоих сообщений. Просто пиши мне, что нужно сделать!\n\n` +
          `💡 <b>Примеры:</b>\n` +
          `• "Купить молоко до завтра"\n` +
          `• "Исправить баг в коде"\n` +
          `• "Подготовить презентацию к пятнице"\n\n` +
          `Используй /tasks для просмотра всех задач.`;
        
        try {
          await this.sendMessage(msg.chat.id, welcomeMessage);
        } catch (error) {
          console.error('❌ [TELEGRAM] Error sending welcome message:', error);
        }
      }
    } catch (error) {
      console.error('❌ [TELEGRAM] Error ensuring user/chat in handleMessage:', error);
    }

    const messageType = this.getMessageType(msg);

    // Проверяем поддерживаемые типы сообщений
    if (!['text', 'voice', 'audio'].includes(messageType)) {
      try {
        await this.sendMessage(msg.chat.id, 'Поддерживаются только текстовые сообщения, голосовые сообщения и аудио файлы.');
      } catch (error) {
        console.error('❌ [TELEGRAM] Error sending unsupported message type warning:', error);
      }
      return;
    }

    // Отправляем индикатор набора текста (может не работать в некоторых группах)
    try {
      await this.bot.sendChatAction(msg.chat.id, 'typing');
    } catch (error) {
    }

    // Устанавливаем реакцию (может не работать если у бота нет прав)
    try {
      await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🤔' }] });
    } catch (error) {
    }

    // Обрабатываем сообщение через MessageProcessor
    const result = await messageProcessor.processMessage(this.bot, msg);

    if (result.success && result.responseMessage) {
      try {
        await this.sendMessage(msg.chat.id, result.responseMessage);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error sending response message:', error);
      }
      
      try {
        await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🍓' }] });
      } catch (error) {
      }

    } else if (!result.success) {
      const errorMessage = result.error || 'Произошла ошибка при обработке сообщения';
      try {
        await this.sendMessage(msg.chat.id, `❌ ${errorMessage}`);
      } catch (error) {
        console.error('❌ [TELEGRAM] Error sending error message:', error);
      }
      
      try {
        await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🤬' }] });
      } catch (error) {
      }
    }
  }


  public start() {
  }

  public stop() {
    this.bot.stopPolling();
  }

  private async sendMessage(chatId: number, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('❌ [TELEGRAM] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Отправляет сообщение пользователю в личный чат
   * Используется для уведомлений
   */
  public async sendNotification(telegramUserId: number, message: string): Promise<boolean> {
    try {
      await this.bot.sendMessage(telegramUserId, message, { parse_mode: 'HTML' });
      return true;
    } catch (error: any) {
      // Игнорируем ошибки, если пользователь заблокировал бота
      if (error.response?.statusCode === 403) {
        // Пользователь заблокировал бота, просто игнорируем
      } else {
        console.error(`❌ [TELEGRAM] Error sending notification to ${telegramUserId}:`, error.message);
      }
      return false;
    }
  }
}