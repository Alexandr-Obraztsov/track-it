import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { messageProcessor } from '../services/messageProcessor';

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
    // Обработчик команды /tasks
    // Регулярное выражение учитывает как /tasks, так и /tasks@bot_username
    this.bot.onText(/^\/tasks(@\w+)?$/, async (msg) => {
      console.log('📋 [TELEGRAM] /tasks command received:', {
        messageId: msg.message_id,
        chatId: msg.chat.id,
        chatType: msg.chat.type,
        userId: msg.from?.id,
        username: msg.from?.username
      });

      try {
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
      console.log('✅ [TELEGRAM] /check command received:', {
        messageId: msg.message_id,
        chatId: msg.chat.id,
        chatType: msg.chat.type,
        userId: msg.from?.id,
        username: msg.from?.username,
        hasReply: !!msg.reply_to_message,
        replyToMessageId: msg.reply_to_message?.message_id
      });

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

      console.log('📝 [TELEGRAM] Processing original message via /check:', {
        originalMessageId: originalMessage.message_id,
        originalSenderId: originalMessage.from?.id,
        originalSenderUsername: originalMessage.from?.username,
        originalText: originalMessage.text,
        originalMessageType: this.getMessageType(originalMessage)
      });

      // Обрабатываем исходное сообщение
      try {
        await this.handleMessage(originalMessage);
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
      // Пропускаем команды - они обрабатываются отдельными обработчиками
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      // Пропускаем системные сообщения (добавление/удаление участников, изменение группы и т.д.)
      if (this.isSystemMessage(msg)) {
        console.log('ℹ️ [TELEGRAM] Skipping system message:', {
          messageId: msg.message_id,
          chatId: msg.chat.id,
          chatType: msg.chat.type,
          systemMessageType: this.getSystemMessageType(msg)
        });
        return;
      }

      // Пропускаем сообщения без отправителя (должно быть редко, но возможно в некоторых случаях)
      if (!msg.from) {
        console.warn('⚠️ [TELEGRAM] Message without sender, skipping:', {
          messageId: msg.message_id,
          chatId: msg.chat.id,
          chatType: msg.chat.type
        });
        return;
      }

      // Пропускаем сообщения от других ботов (но не от самого себя)
      if (msg.from.is_bot) {
        console.log('🤖 [TELEGRAM] Skipping message from bot');
        return;
      }

      // В групповых чатах игнорируем обычные сообщения - обрабатываем только через /check
      if (msg.chat.type !== 'private') {
        console.log('👥 [TELEGRAM] Skipping group message (use /check command to process):', {
          messageId: msg.message_id,
          chatId: msg.chat.id,
          chatType: msg.chat.type
        });
        return;
      }

      // В личных чатах обрабатываем все сообщения автоматически
      console.log('📨 [TELEGRAM] Message received:', {
        messageId: msg.message_id,
        chatId: msg.chat.id,
        chatType: msg.chat.type,
        userId: msg.from?.id,
        username: msg.from?.username,
        firstName: msg.from?.first_name,
        lastName: msg.from?.last_name,
        timestamp: new Date().toISOString(),
        messageType: this.getMessageType(msg)
      });

      try {
        await this.handleMessage(msg);
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

  private async handleMessage(msg: TelegramBot.Message) {
    // Дополнительная проверка на наличие отправителя
    if (!msg.from) {
      console.warn('⚠️ [TELEGRAM] Message without sender in handleMessage');
      return;
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
      console.warn('⚠️ [TELEGRAM] Could not send chat action (may not have permissions):', error);
    }

    // Устанавливаем реакцию (может не работать если у бота нет прав)
    try {
      await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🤔' }] });
    } catch (error) {
      console.warn('⚠️ [TELEGRAM] Could not set message reaction (may not have permissions):', error);
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
        console.warn('⚠️ [TELEGRAM] Could not set success reaction:', error);
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
        console.warn('⚠️ [TELEGRAM] Could not set error reaction:', error);
      }
    }
  }


  public start() {
    console.log('🚀 [TELEGRAM] Bot started with polling');
  }

  public stop() {
    this.bot.stopPolling();
    console.log('🛑 [TELEGRAM] Bot stopped');
  }

  private async sendMessage(chatId: number, message: string): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('❌ [TELEGRAM] Error sending message:', error);
      throw error;
    }
  }
}