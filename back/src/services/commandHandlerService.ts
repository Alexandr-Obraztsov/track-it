import TelegramBot = require('node-telegram-bot-api')
import { TaskService } from './taskService'
import { ChatService } from './chatService'
import { RoleService } from './roleService'
import { MessageFormatterService } from './messageFormatterService'

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

    // Обработка команды /register (информационная, так как регистрация автоматическая)
    async handleRegister(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'ℹ️ В личных сообщениях регистрация не требуется. Просто используйте команды!')
            return
        }

        try {
            // Создаем или получаем чат
            await this.chatService.getOrCreateChat(
                chatId,
                msg.chat.title || 'Unknown Group',
                msg.chat.username
            )

            // Проверяем, зарегистрирован ли уже пользователь
            const existingMember = await this.chatService.getMemberById(chatId, userId)
            if (existingMember) {
                bot.sendMessage(chatId, `✅ ${msg.from!.first_name || msg.from!.username}, вы уже зарегистрированы в системе!`)
                return
            }

            // Автоматически регистрируем пользователя
            const member = await this.chatService.registerMember(
                chatId,
                userId,
                msg.from!.username || '',
                msg.from!.first_name || '',
                msg.from!.last_name || ''
            )

            bot.sendMessage(chatId, `✅ ${member.firstName || member.username} зарегистрирован в системе!\n\nℹ️ В дальнейшем регистрация происходит автоматически при отправке любого сообщения.`)
        } catch (error) {
            console.error('Ошибка регистрации:', error)
            bot.sendMessage(chatId, 'Произошла ошибка при регистрации. Попробуйте написать любое сообщение для автоматической регистрации.')
        }
    }

    // Обработка команды /members
    async handleMembers(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Команда /members доступна только в группах')
            return
        }

        try {
            const members = await this.chatService.getChatMembers(chatId)
            
            // Получаем участников с ролями
            const memberDetails = []
            for (const member of members) {
                const memberWithRole = await this.chatService.getMemberWithRole(chatId, member.userId)
                memberDetails.push(memberWithRole)
            }
            
            const response = MessageFormatterService.formatMembersList(memberDetails)
            bot.sendMessage(chatId, response)
        } catch (error) {
            console.error('Ошибка получения участников:', error)
            bot.sendMessage(chatId, 'Ошибка при получении списка участников')
        }
    }

    // Обработка команды /roles
    async handleRoles(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Команда доступна только в групповых чатах')
            return
        }

        try {
            const roles = await this.chatService.getChatRolesWithMembers(chatId)
            const response = MessageFormatterService.formatRolesList(roles)
            bot.sendMessage(chatId, response)
        } catch (error) {
            console.error('Ошибка при получении ролей:', error)
            bot.sendMessage(chatId, 'Ошибка при получении ролей')
        }
    }

    // Обработка команды /tasks
    async handleTasks(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        try {
            let tasks
            if (isGroup) {
                const chat = await this.chatService.getOrCreateChat(chatId, msg.chat.title || 'Unknown Group', msg.chat.username)
                tasks = await this.taskService.getTasksByChat(chatId)
            } else {
                tasks = await this.taskService.getPersonalTasks(userId)
            }

            if (tasks.length === 0) {
                bot.sendMessage(chatId, 'У вас нет задач')
            } else {
                let response = isGroup ? 'Задачи группы:\n' : 'Ваши задачи:\n'
                tasks.forEach((task, index) => {
                    const taskId = MessageFormatterService.createTaskId(msg.chat.title || 'Chat', task.id)
                    response += `\n${index + 1}. ${taskId}: ${task.title}\n`
                    response += `   📋 ${task.description}\n`
                    response += `   🔥 Приоритет: ${MessageFormatterService.translatePriority(task.priority)}\n`
                    response += `   ✅ Статус: ${task.isCompleted ? 'Выполнена' : 'Активна'}\n`
                    if (task.deadline) {
                        response += `   📅 Срок: ${new Date(task.deadline).toLocaleDateString('ru-RU')}\n`
                    }
                })
                bot.sendMessage(chatId, response)
            }
        } catch (error) {
            console.error('Ошибка получения задач:', error)
            bot.sendMessage(chatId, 'Ошибка при получении задач')
        }
    }

    // Обработка команды /pin_welcome
    async handlePinWelcome(bot: TelegramBot, msg: any): Promise<void> {
        const chatId = msg.chat.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Команда доступна только в групповых чатах')
            return
        }

        try {
            // Проверяем права пользователя
            const member = await bot.getChatMember(chatId, msg.from!.id)
            if (member.status !== 'administrator' && member.status !== 'creator') {
                bot.sendMessage(chatId, 'Эта команда доступна только администраторам группы')
                return
            }

            // Отправляем новое приветственное сообщение
            const welcomeMessage = '🎉 Привет! Я бот для управления задачами в группах!\n\n' +
                'Чтобы начать использовать все возможности бота, каждый участник должен зарегистрироваться.\n\n' +
                'Зарегистрируйтесь, нажав кнопку ниже:'

            const registerKeyboard = {
                inline_keyboard: [
                    [{ text: '📝 Зарегистрироваться', callback_data: 'register' }]
                ]
            }

            const sentMessage = await bot.sendMessage(chatId, welcomeMessage, {
                reply_markup: registerKeyboard
            })

            // Закрепляем сообщение
            await bot.pinChatMessage(chatId, sentMessage.message_id)
            bot.sendMessage(chatId, '✅ Приветственное сообщение закреплено!')

        } catch (error) {
            console.error('Ошибка закрепления приветственного сообщения:', error)
            bot.sendMessage(chatId, '❌ Ошибка закрепления сообщения. Возможно, у бота нет прав администратора.')
        }
    }

    // Обработка команды назначения роли
    async handleRoleAssign(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Команда доступна только в групповых чатах')
            return
        }

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /role_assign @username роль')
            return
        }

        try {
            // Проверяем права текущего пользователя
            const currentMember = await this.chatService.getMemberWithRole(chatId, userId)
            if (!currentMember?.role || !['admin', 'moderator'].includes(currentMember.role.name)) {
                bot.sendMessage(chatId, 'У вас нет прав для назначения ролей')
                return
            }

            const parts = match[1].trim().split(' ')
            if (parts.length < 2) {
                bot.sendMessage(chatId, 'Использование: /role_assign @username роль')
                return
            }

            const username = parts[0].replace('@', '')
            const roleName = parts.slice(1).join(' ')

            // Находим целевого пользователя
            const members = await this.chatService.getChatMembers(chatId)
            const targetMember = members.find(member => member.username === username)

            if (!targetMember) {
                bot.sendMessage(chatId, `Пользователь @${username} не найден в группе`)
                return
            }

            // Находим роль
            const role = await this.roleService.getRoleByName(chatId, roleName)
            if (!role) {
                bot.sendMessage(chatId, `Роль "${roleName}" не найдена`)
                return
            }

            // Назначаем роль
            const success = await this.chatService.assignRoleToUser(chatId, targetMember.userId, role.id)
            if (success) {
                bot.sendMessage(chatId, `✅ Роль "${roleName}" назначена пользователю @${username}`)
            } else {
                bot.sendMessage(chatId, `❌ Не удалось назначить роль "${roleName}" пользователю @${username}`)
            }

        } catch (error) {
            console.error('Ошибка назначения роли:', error)
            bot.sendMessage(chatId, 'Ошибка при назначении роли')
        }
    }

    // Обработка команды удаления роли
    async handleRoleRemove(bot: TelegramBot, msg: any, match: RegExpExecArray | null): Promise<void> {
        const chatId = msg.chat.id.toString()
        const userId = msg.from!.id.toString()
        const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'

        if (!isGroup) {
            bot.sendMessage(chatId, 'Команда доступна только в групповых чатах')
            return
        }

        if (!match || !match[1]) {
            bot.sendMessage(chatId, 'Использование: /role_remove @username')
            return
        }

        try {
            // Проверяем права текущего пользователя
            const currentMember = await this.chatService.getMemberWithRole(chatId, userId)
            if (!currentMember?.role || !['admin', 'moderator'].includes(currentMember.role.name)) {
                bot.sendMessage(chatId, 'У вас нет прав для удаления ролей')
                return
            }

            const username = match[1].trim().replace('@', '')

            // Находим целевого пользователя
            const members = await this.chatService.getChatMembers(chatId)
            const targetMember = members.find(member => member.username === username)

            if (!targetMember) {
                bot.sendMessage(chatId, `Пользователь @${username} не найден в группе`)
                return
            }

            // Удаляем роль
            const success = await this.chatService.removeRoleFromUser(chatId, targetMember.userId)
            if (success) {
                bot.sendMessage(chatId, `✅ Роль удалена у пользователя @${username}`)
            } else {
                bot.sendMessage(chatId, `❌ Не удалось удалить роль у пользователя @${username}`)
            }

        } catch (error) {
            console.error('Ошибка удаления роли:', error)
            bot.sendMessage(chatId, 'Ошибка при удалении роли')
        }
    }
}