import { DataSource, Repository, MoreThan } from 'typeorm'
import { TaskEntity } from '../entities/Task'
import TelegramBot from 'node-telegram-bot-api'
import { UserNotificationService } from './userNotificationService'

export class NotificationService {
	private taskRepository: Repository<TaskEntity>
	private bot: TelegramBot
	private userNotificationService: UserNotificationService

	private readonly CHECK_INTERVAL_MS = 60 * 1000

	constructor(dataSource: DataSource, bot: TelegramBot) {
		this.taskRepository = dataSource.getRepository(TaskEntity)
		this.bot = bot
		this.userNotificationService = new UserNotificationService(dataSource)
	}

	/**
	 * Запускает процесс проверки задач на уведомления
	 * Вызывается каждую минуту
	 */
	public async checkNotifications(): Promise<void> {
		try {
			
			// Получаем все невыполненные задачи с дедлайнами
			const tasksWithDeadlines = await this.getTasksWithDeadlines()
			
			for (const task of tasksWithDeadlines) {
				await this.processTaskNotifications(task)
			}
			
		} catch (error) {
			console.error('❌ Ошибка при проверке уведомлений:', error)
		}
	}

	/**
	 * Получает все невыполненные задачи с дедлайнами
	 */
	private async getTasksWithDeadlines(): Promise<TaskEntity[]> {
		const now = new Date()
		
		return await this.taskRepository.find({
			where: {
				isCompleted: false,
				deadline: MoreThan(now), // Только задачи с дедлайном в будущем
			},
			relations: ['author', 'chat', 'assignedUser', 'assignedRole'],
		})
	}

	/**
	 * Обрабатывает уведомления для конкретной задачи
	 */
	private async processTaskNotifications(task: TaskEntity): Promise<void> {
		if (!task.deadline) return

		const now = new Date()
		const timeUntilDeadline = task.deadline.getTime() - now.getTime()
		
		// Если дедлайн уже прошел, не отправляем уведомления
		if (timeUntilDeadline <= 0) return

		// Определяем кому отправить уведомление
		const targetUserId = this.getNotificationTargetUserId(task)
		if (!targetUserId) return

		// Проверяем, включены ли уведомления для этого пользователя
		const notificationsEnabled = await this.userNotificationService.areNotificationsEnabled(
			targetUserId, 
			task.type
		)
		
		if (!notificationsEnabled) return

		// Получаем интервалы уведомлений для этого пользователя
		const intervals = await this.userNotificationService.getUserNotificationIntervals(
			targetUserId, 
			task.type
		)
		
		if (!intervals || intervals.length === 0) return

		// Проверяем каждый интервал
		for (const interval of intervals) {
			if (this.shouldSendNotification(interval, timeUntilDeadline)) {
				await this.sendNotification(task, interval.name, targetUserId)
			}
		}
	}

	/**
	 * Определяет ID пользователя для отправки уведомления
	 */
	private getNotificationTargetUserId(task: TaskEntity): string | null {
		if (task.type === 'group' && task.assignedUserId) {
			return task.assignedUserId
		}
		
		return task.authorId
	}

	/**
	 * Проверяет, нужно ли отправить уведомление
	 */
	private shouldSendNotification(
		interval: { name: string; ms: number }, 
		timeUntilDeadline: number
	): boolean {
		
		// Проверяем, попадает ли текущее время в интервал уведомления
		const tolerance = this.CHECK_INTERVAL_MS
		return timeUntilDeadline <= interval.ms && timeUntilDeadline > (interval.ms - tolerance)
	}

	/**
	 * Отправляет уведомление о дедлайне в личные сообщения
	 */
	private async sendNotification(
		task: TaskEntity, 
		intervalName: string, 
		targetUserId: string
	): Promise<void> {
		try {
			const message = this.formatNotificationMessage(task, intervalName)
			
			await this.bot.sendMessage(targetUserId, message, { parse_mode: 'HTML' })
			console.log(`📤 Уведомление отправлено пользователю ${targetUserId} о задаче ${task.readableId}`)
			
		} catch (error) {
			console.error(`❌ Ошибка отправки уведомления для задачи ${task.readableId}:`, error)
		}
	}

	/**
	 * Форматирует сообщение уведомления
	 */
	private formatNotificationMessage(
		task: TaskEntity, 
		intervalName: string
	): string {
		// Форматируем дедлайн в зависимости от типа задачи
		const deadlineDate = new Date(task.deadline!)
		const deadlineText = deadlineDate.toLocaleString('ru-RU')
		
		let message = `🔔 <b>Напоминание о дедлайне</b>\n\n`
		message += `<b>${task.title}</b>\n`
		message += `📝 ${task.description}\n\n`
		message += `⏰ До дедлайна осталось: <b>${intervalName}</b>\n`
		message += `📅 Дедлайн: ${deadlineText}\n`
		message += `🆔 Задача: ${task.readableId}\n`

		// Добавляем информацию о типе задачи
		if (task.type === 'group') {
			message += `👥 Групповая задача`
			if (task.chat) {
				message += ` из "<b>${task.chat.title}</b>"`
			}
		}

		// Добавляем информацию о назначении для групповых задач
		if (task.type === 'group' && task.assignedRole) {
			message += `\n🎯 Назначена роли: ${task.assignedRole.name}`
		}

		return message
	}

	/**
	 * Запускает периодическую проверку уведомлений
	 * Вызывается каждую минуту
	 */
	public startNotificationScheduler(): void {
		console.log('🚀 Запуск планировщика уведомлений...')
		
		// Запускаем немедленно
		this.checkNotifications()
		
		// Затем запускаем каждую минуту
		setInterval(() => {
			this.checkNotifications()
		}, this.CHECK_INTERVAL_MS)
		
		console.log('✅ Планировщик уведомлений запущен (проверка каждую минуту)')
	}

	/**
	 * Получает экземпляр UserNotificationService для внешнего использования
	 */
	public getUserNotificationService(): UserNotificationService {
		return this.userNotificationService
	}
}