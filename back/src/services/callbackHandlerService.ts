import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'

// Сервис для обработки callback query
export class CallbackHandlerService {
    private taskService: TaskService
    private chatService: ChatService

    constructor(taskService: TaskService, chatService: ChatService) {
        this.taskService = taskService
        this.chatService = chatService
    }

    // Обработка callback query
    async handleCallbackQuery(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> {
        const data = callbackQuery.data
        const msg = callbackQuery.message
        const user = callbackQuery.from

        if (!data || !msg) return

        try {
            if (data === 'register') {
                await this.handleRegisterCallback(bot, callbackQuery, msg, user)
            }

            // Подтверждаем callback
            bot.answerCallbackQuery(callbackQuery.id)
        } catch (error) {
            console.error('Ошибка обработки callback:', error)
            bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' })
        }
    }

    // Обработка callback регистрации
    private async handleRegisterCallback(
        bot: TelegramBot, 
        callbackQuery: TelegramBot.CallbackQuery,
        msg: TelegramBot.Message,
        user: TelegramBot.User
    ): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = user.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.answerCallbackQuery(callbackQuery.id, { text: 'Регистрация доступна только в групповых чатах' })
            return
        }

        try {
            // Создаем или получаем чат
            const chat = await this.chatService.getOrCreateChat(
                chatId,
                msg.chat.title || 'Unknown Group',
                msg.chat.username
            )

            // Проверяем, зарегистрирован ли уже пользователь
            const existingMember = await this.chatService.getMemberById(chatId, userId)
            if (existingMember) {
                bot.answerCallbackQuery(callbackQuery.id, { 
                    text: `${user.first_name || user.username}, вы уже зарегистрированы!`, 
                    show_alert: true 
                })
                return
            }

            // Регистрируем пользователя
            const member = await this.chatService.registerMember(
                chatId,
                userId,
                user.username || '',
                user.first_name || '',
                user.last_name || ''
            )

            bot.answerCallbackQuery(callbackQuery.id, { 
                text: `✅ ${member.firstName || member.username} успешно зарегистрирован!`, 
                show_alert: true 
            })

            // Отправляем сообщение в чат
            bot.sendMessage(chatId, `✅ ${member.firstName || member.username} зарегистрировался в группе!`)

        } catch (error) {
            console.error('Ошибка регистрации через callback:', error)
            bot.answerCallbackQuery(callbackQuery.id, { 
                text: 'Произошла ошибка при регистрации', 
                show_alert: true 
            })
        }
    }
}