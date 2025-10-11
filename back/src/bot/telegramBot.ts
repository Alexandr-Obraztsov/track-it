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
    // Универсальный обработчик всех сообщений
    this.bot.on('message', async (msg) => {
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
        await this.bot.sendMessage(msg.chat.id, 'Произошла ошибка при обработке сообщения');
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

  private async handleMessage(msg: TelegramBot.Message) {
    const messageType = this.getMessageType(msg);

    // Проверяем поддерживаемые типы сообщений
    if (!['text', 'voice', 'audio'].includes(messageType)) {
      await this.bot.sendMessage(msg.chat.id, 'Поддерживаются только текстовые сообщения, голосовые сообщения и аудио файлы.');
      return;
    }

    await this.bot.sendChatAction(msg.chat.id, 'typing');
    await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🤔' }] });

    // Обрабатываем сообщение через MessageProcessor
    const result = await messageProcessor.processMessage(this.bot, msg);

    if (result.success && result.responseMessage) {
      await this.sendMessage(msg.chat.id, result.responseMessage);
      await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🍓' }] });

    } else if (!result.success) {
      const errorMessage = result.error || 'Произошла ошибка при обработке сообщения';
      await this.sendMessage(msg.chat.id, `❌ ${errorMessage}`);
      await this.bot.setMessageReaction(msg.chat.id, msg.message_id, { reaction: [{ type: 'emoji', emoji: '🤬' }] });
    }
  }


  public start() {
    console.log('🚀 [TELEGRAM] Bot started with polling');
  }

  public stop() {
    this.bot.stopPolling();
    console.log('🛑 [TELEGRAM] Bot stopped');
  }

  private sendMessage(chatId: number, message: string) {
    this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }
}