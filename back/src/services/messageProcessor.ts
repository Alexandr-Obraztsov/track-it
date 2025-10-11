import TelegramBot from 'node-telegram-bot-api';
import { geminiService } from './geminiService';
import { GeminiResult, TaskExtractionParams } from '../types';
import { AudioUtils } from '../utils/audioUtils';
import { Formatter } from '../utils/formatter';
import { Chat } from '../entities/Chat';
import { taskService } from './task-service/task-service';
import { userManager } from './userManager';

export type ProcessedMessage = {
  text: string;
} | {
  audioData: Buffer;
  audioMimeType: string;
}

export interface ProcessResult {
  success: boolean;
  result?: GeminiResult;
  error?: string;
  responseMessage?: string;
}

export class MessageProcessor {
  /**
   * Основной метод обработки сообщения
   */
  async processMessage(
    bot: TelegramBot,
    msg: TelegramBot.Message
  ): Promise<ProcessResult> {
    try {
      const isPersonal = msg.chat.type === 'private';

      // Определяем тип сообщения и извлекаем контент
      const processedMessage = await this.extractMessageContent(bot, msg);

      if (!processedMessage) {
        return {
          success: false,
          error: 'Unsupported message type'
        };
      }

      // Получаем или создаем пользователя и чат
      const user = await userManager.getOrCreateUser(msg.from!);
      
      let chat: Chat | undefined;
      if (!isPersonal) {
        chat = await userManager.getOrCreateChat(msg.chat);
      }

      // Получаем существующие задачи
      const existingTasks = isPersonal 
        ? await taskService.getUserPersonalTasks(user.id)
        : await taskService.getChatTasks(chat!.id);

      const geminiResult = await geminiService.extractTasks({
        ...processedMessage,
        isPersonal,
        user,
        chat: chat,
        existingTasks
      } as TaskExtractionParams);

      // Сохраняем задачи в базу данных
      const savedResult = isPersonal 
        ? await taskService.saveTasks({
            geminiResult,
            isPersonal: true,
            user
          })
        : await taskService.saveTasks({
            geminiResult,
            isPersonal: false,
            chat: chat!
          });

      // Формируем ответное сообщение
      const responseMessage = await this.formatResponseMessage(geminiResult);

      return {
        success: true,
        result: geminiResult,
        responseMessage
      };

    } catch (error) {
      console.error('❌ [MESSAGE_PROCESSOR] Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Извлекает контент из сообщения в зависимости от типа
   */
  private async extractMessageContent(
    bot: TelegramBot,
    msg: TelegramBot.Message
  ): Promise<ProcessedMessage | null> {

    if (msg.text) {
      return {
        text: msg.text,
      };
    }
    
    if (msg.voice) {
      const fileUrl = await bot.getFileLink(msg.voice.file_id);
      const audioResult = await AudioUtils.processTelegramVoice(
        fileUrl,
        'voice.ogg'
      );
      return {
        audioData: audioResult.data,
        audioMimeType: audioResult.mimeType
      };
    }

    return null;
  }

  /**
   * Форматирует ответное сообщение для пользователя
   */
  private async formatResponseMessage(
    result: GeminiResult,
  ): Promise<string> {
    const { newTasks, updatedTasks } = result;

    if (newTasks.length === 0 && updatedTasks.length === 0) {
      return '🤷‍♂️ Задачи не найдены в сообщении';
    }

    let response = '';

    if (newTasks.length > 0) {
      response += '✨ <b>Новые задачи</b>\n';
      response += '━━━━━━━━━━━━━━━━━━━━\n\n';
      
      for (let index = 0; index < newTasks.length; index++) {
        const task = newTasks[index];
        response += `🎯 <b>${task.title}</b>\n`;
        
        if (task.description) {
          response += `📝 ${task.description}\n`;
        }
        
        if (task.deadline) {
          response += `⏰ <i>Срок: ${new Date(task.deadline).toLocaleString('ru-RU')}</i>\n`;
        }
        
        if (task.assignedUserId || task.assignedRoleId) {
          response += `👤 <i>Назначено: `;
          if (task.assignedUserId) {
            const assignedUser = await userManager.getUserById(task.assignedUserId);
            if (assignedUser) {
              response += Formatter.tagUser(assignedUser);
            } else {
              response += `Пользователь #${task.assignedUserId}`;
            }
          }
          if (task.assignedRoleId) {
            response += `Роль #${task.assignedRoleId}`;
          }
          response += `</i>\n`;
        }
        
        response += '\n';
      }
    }

    if (updatedTasks.length > 0) {
      if (newTasks.length > 0) response += '\n';
      response += '🔄 <b>Обновленные задачи</b>\n';
      response += '━━━━━━━━━━━━━━━━━━━━\n\n';
      
      for (let index = 0; index < updatedTasks.length; index++) {
        const task = updatedTasks[index];
        
        // Получаем актуальную задачу из базы данных для отображения заголовка
        const actualTask = await taskService.getTaskById(task.id);
        
        if (!actualTask) {
          console.error('❌ [MESSAGE_PROCESSOR] Task not found for update:', task.id);
          continue;
        }
        
        const taskTitle = actualTask.title;
        
        response += `🎯 <b>${taskTitle}</b>\n`;

        if (task.title) {
          response += `🎯 <i>Новый заголовок: ${task.title}</i>\n`;
        }
        
        if (task.description) {
          response += `📄 Новое описание: ${task.description}\n`;
        }
        
        if (task.deadline) {
          response += `⏰ <i>Новый дедлайн: ${new Date(task.deadline).toLocaleString('ru-RU')}</i>\n`;
        }
        
        const actualAssigned = actualTask.assignedUser ?
        Formatter.tagUser(actualTask.assignedUser) :
        actualTask.assignedRole ?
        `Роль #${actualTask.assignedRole.id}` :
        'Не назначено';
        if (task.assignedUserId || task.assignedRoleId) {
          response += `👤 <i>Назначено: ${actualAssigned} -> `;
          if (task.assignedUserId) {
            const assignedUser = await userManager.getUserById(task.assignedUserId);
            if (assignedUser) {
              response += Formatter.tagUser(assignedUser);
            } else {
              response += `Пользователь #${task.assignedUserId}`;
            }
          }
          if (task.assignedRoleId) {
            response += `Роль #${task.assignedRoleId}`;
          }
          response += `</i>\n`;
        }
        
        response += '\n';
      }
    }

    // Добавляем итоговую статистику
    const totalNew = newTasks.length;
    const totalUpdated = updatedTasks.length;
    response += '━━━━━━━━━━━━━━━━━━━━\n';
    response += `📊 <i>Итого: +${totalNew} новых, 🔄 ${totalUpdated} обновлено</i>`;

    return response;
  }
}

export const messageProcessor = new MessageProcessor();
