import TelegramBot = require('node-telegram-bot-api')

// Сервис для обработки команд Telegram
export class CommandHandlerService {
    // Обработка команды /start
    async handleStart(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Привет! Я бот для управления задачами.\n\n🎙️ Отправьте голосовое сообщение для создания и управления задачами с помощью ИИ!')
        }
    }
}