import { TaskEntity } from '../../entities/Task'
import { RoleEntity } from '../../entities/Role'
import { TaskOperation, RoleOperation } from '../../types'
import { FormatRoleOperationParams } from './types'
import { UserFormatter } from './userFormatter'
import { MessageFormatter } from './messageFormatter'

/**
 * Форматтер для работы с операциями
 * Отвечает только за форматирование результатов операций (создание, обновление, удаление)
 */
export class OperationFormatter {
	/**
	 * Форматирует результат операции с задачей
	 * Используется для отображения результатов операций CRUD с задачами
	 */
	static formatTaskOperation(operation: TaskOperation, success: boolean, task: TaskEntity): string {		
		switch (operation.operation) {
			case 'delete':
				if (success) {
					return `🗑️ <b>Задача удалена</b>\n${task.readableId}: ${task.title}`
				} else {
					return `❌ <b>Ошибка удаления</b>\nНе удалось удалить задачу ${task.readableId}`
				}
				
			case 'update':
				if (success && operation.updateData) {
					const changes = []
					
					if (operation.updateData.title && operation.updateData.title !== task.title) {
						changes.push(`название: "${task.title}" → "${operation.updateData.title}"`)
					}
					
					if (operation.updateData.description !== undefined && operation.updateData.description !== task.description) {
						const oldDesc = task.description || 'отсутствует'
						const newDesc = operation.updateData.description || 'отсутствует'
						changes.push(`описание: "${oldDesc}" → "${newDesc}"`)
					}
					
					if (operation.updateData.deadline !== undefined) {
						const oldDeadline = task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : 'отсутствует'
						const newDeadline = operation.updateData.deadline ? new Date(operation.updateData.deadline).toLocaleDateString('ru-RU') : 'отсутствует'
						if (oldDeadline !== newDeadline) {
							changes.push(`дедлайн: ${oldDeadline} → ${newDeadline}`)
						}
					}
					
					if (operation.updateData.isCompleted !== undefined && operation.updateData.isCompleted !== task.isCompleted) {
						const oldStatus = task.isCompleted ? MessageFormatter.TASK_STATUS.COMPLETED : MessageFormatter.TASK_STATUS.IN_PROGRESS
						const newStatus = operation.updateData.isCompleted ? MessageFormatter.TASK_STATUS.COMPLETED : MessageFormatter.TASK_STATUS.IN_PROGRESS
						changes.push(`статус: ${oldStatus} → ${newStatus}`)
					}
					
					if (changes.length > 0) {
						return `🔄 <b>Задача ${task.readableId} обновлена</b>\n${changes.map(c => `• ${c}`).join('\n')}`
					} else {
						return `🔄 <b>Задача ${task.readableId} обновлена</b>\n📝 Изменений не обнаружено`
					}
				} else {
					return `❌ <b>Ошибка обновления</b>\nНе удалось обновить задачу ${task.readableId}`
				}
				
			case 'complete':
				if (success) {
					return `✅ <b>Задача ${task.readableId} выполнена!</b>\n${task.title}`
				} else {
					return `❌ <b>Ошибка</b>\nНе удалось отметить задачу ${task.readableId} как выполненную`
				}
				
			default:
				return `❓ Неизвестная операция с задачей ${task.readableId}`
		}
	}
}
