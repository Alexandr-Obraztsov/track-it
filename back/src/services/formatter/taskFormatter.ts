import { TaskEntity } from '../../entities/Task'
import { UserFormatter } from './userFormatter'

/**
 * Форматтер для работы с задачами
 * Отвечает только за форматирование информации о задачах
 */
export class TaskFormatter {
	/**
	 * Создает читаемый ID задачи на основе названия чата и локального номера
	 * Используется при создании новых задач
	 */
	static createTaskId(chatTitle: string, taskLocalId: number): string {
		const prefix = chatTitle.slice(0, 3).toUpperCase()
		return `${prefix}-${taskLocalId}`
	}

	/**
	 * Форматирует информацию о дедлайне с красивым выводом
	 * Показывает время до дедлайна и дату
	 */
	static formatDeadline(deadline: Date): string {
		const deadlineDate = new Date(deadline)
		
		const dateStr = deadlineDate.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
		
		return dateStr
	}

	/**
	 * Форматирует одну задачу для отображения в списке или детальном просмотре
	 * Основной метод для отображения информации о задаче
	 */
	static formatTask(task: TaskEntity): string {
		const result = []
		
		result.push(`<b>${task.readableId}: ${task.title}</b>`)
		
		// Описание задачи (только если есть и отличается от заголовка)
		if (task.description && task.description.trim() !== task.title.trim()) {
			result.push(`<i>${task.description}</i>`)
		}
		
		// Дедлайн
		if (task.deadline) {
			const deadlineFormatted = this.formatDeadline(task.deadline)
			result.push(`⏰ ${deadlineFormatted}`)
		}
		
		// Назначение с тегом FYI
		if (task.type === 'group') {
			if (task.assignedUser) {
				result.push(`${UserFormatter.createTag(task.assignedUser)} FYI`)
			} else if (task.assignedRole) {
				result.push(`${task.assignedRole.name} FYI`)
			}
		}
				
		return result.join('\n')
	}
}
