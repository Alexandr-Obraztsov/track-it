import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'

// Сервис для обработки команд Telegram
export class CommandHandlerService {
    private taskService: TaskService
    private chatService: ChatService
    private roleService: RoleService

    constructor(taskService: TaskService, chatService: ChatService, roleService: RoleService) {
        this.taskService = taskService
        this.chatService = chatService
        this.roleService = roleService
    }

    // Обработка команды /start
    async handleStart(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (isGroup) {
            const welcomeText = 'Привет! Я бот для управления задачами в группах.\n\n' +
                '🎙️ Отправьте голосовое сообщение для:\n' +
                '• Создания новых задач\n' +
                '• Управления существующими задачами\n' +
                '• Работы с ролями участников\n' +
                '• Просмотра списков и статистики\n\n' +
                'ℹ️ Регистрация происходит автоматически!\n' +
                '🤖 Все управление происходит через голосовые команды и ИИ!'
            
            bot.sendMessage(chatId, welcomeText)
        } else {
            bot.sendMessage(chatId, 'Привет! Я бот для управления задачами.\n\n🎙️ Отправьте голосовое сообщение для создания и управления задачами с помощью ИИ!')
        }
    }

    // Обработка команды /help
    async handleHelp(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (isGroup) {
            const helpText = '🤖 Бот для управления задачами через голосовые команды\n\n' +
                '🎙️ Что можно сделать голосом:\n\n' +
                '📝 СОЗДАНИЕ ЗАДАЧ:\n' +
                '• "Создай задачу написать документацию"\n' +
                '• "Добавь задачу на Петю - протестировать приложение"\n' +
                '• "Сделать дизайн до завтра, высокий приоритет"\n\n' +
                '📋 УПРАВЛЕНИЕ ЗАДАЧАМИ:\n' +
                '• "Покажи все задачи"\n' +
                '• "Удали задачу номер 3"\n' +
                '• "Отметь задачу 5 как выполненную"\n' +
                '• "Назначь задачу 2 на Машу"\n\n' +
                '👥 РАБОТА С РОЛЯМИ:\n' +
                '• "Создай роль разработчик"\n' +
                '• "Назначь Ивану роль админ"\n' +
                '• "Покажи всех участников"\n' +
                '• "Какие роли есть?"\n\n' +
                '✨ Просто говорите естественно - ИИ поймет ваши команды!'
            
            bot.sendMessage(chatId, helpText)
        } else {
            bot.sendMessage(chatId, '🤖 Бот для управления задачами\n\n🎙️ Отправьте голосовое сообщение для создания и управления задачами с помощью ИИ!\n\nПримеры команд:\n• "Создай задачу купить продукты"\n• "Покажи мои задачи"\n• "Отметь задачу 1 как выполненную"')
        }
    }

}