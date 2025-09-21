import { DataSource, Repository } from 'typeorm'
import { UserEntity } from '../entities/User'
import {
	NotificationPresetType,
	NotificationPresetUtils
} from '../configs/notificationPresets'

// Интерфейс для обновления настроек уведомлений
export interface UpdateNotificationSettingsDto {
	personalPreset?: NotificationPresetType
	groupPreset?: NotificationPresetType
}

// Интерфейс для получения настроек пользователя
export interface UserNotificationSettings {
	userId: string
	personalPreset: NotificationPresetType
	groupPreset: NotificationPresetType
	personalIntervals: Array<{ name: string; ms: number }>
	groupIntervals: Array<{ name: string; ms: number }>
}

// Сервис для управления настройками уведомлений пользователей
export class UserNotificationService {
	private userRepository: Repository<UserEntity>

	constructor(dataSource: DataSource) {
		this.userRepository = dataSource.getRepository(UserEntity)
	}

	/**
	 * Получает настройки уведомлений пользователя
	 */
	async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
		const user = await this.userRepository.findOne({
			where: { telegramId: userId }
		})

		if (!user) {
			return null
		}

		const personalPreset = NotificationPresetUtils.getPersonalPreset(user.personalNotificationPreset)
		const groupPreset = NotificationPresetUtils.getGroupPreset(user.groupNotificationPreset)

		return {
			userId: user.telegramId,
			personalPreset: user.personalNotificationPreset,
			groupPreset: user.groupNotificationPreset,
			personalIntervals: personalPreset.intervals,
			groupIntervals: groupPreset.intervals
		}
	}

	/**
	 * Обновляет настройки уведомлений пользователя
	 */
	async updateUserNotificationSettings(
		userId: string, 
		settings: UpdateNotificationSettingsDto
	): Promise<UserNotificationSettings | null> {
		const user = await this.userRepository.findOne({
			where: { telegramId: userId }
		})

		if (!user) {
			throw new Error('Пользователь не найден')
		}

		// Валидируем пресеты
		if (settings.personalPreset && !NotificationPresetUtils.isValidPresetType(settings.personalPreset)) {
			throw new Error(`Неверный тип пресета для личных задач: ${settings.personalPreset}`)
		}

		if (settings.groupPreset && !NotificationPresetUtils.isValidPresetType(settings.groupPreset)) {
			throw new Error(`Неверный тип пресета для групповых задач: ${settings.groupPreset}`)
		}

		// Обновляем настройки
		if (settings.personalPreset !== undefined) {
			user.personalNotificationPreset = settings.personalPreset
		}

		if (settings.groupPreset !== undefined) {
			user.groupNotificationPreset = settings.groupPreset
		}

		await this.userRepository.save(user)

		// Возвращаем обновленные настройки
		return this.getUserNotificationSettings(userId)
	}

	/**
	 * Получает интервалы уведомлений для конкретного типа задач пользователя
	 */
	async getUserNotificationIntervals(
		userId: string, 
		taskType: 'personal' | 'group'
	): Promise<Array<{ name: string; ms: number }> | null> {
		const user = await this.userRepository.findOne({
			where: { telegramId: userId }
		})

		if (!user) {
			return null
		}

		const presetType = taskType === 'personal' 
			? user.personalNotificationPreset 
			: user.groupNotificationPreset

		const preset = taskType === 'personal'
			? NotificationPresetUtils.getPersonalPreset(presetType)
			: NotificationPresetUtils.getGroupPreset(presetType)

		return preset.intervals
	}

	/**
	 * Проверяет, включены ли уведомления для пользователя
	 */
	async areNotificationsEnabled(userId: string, taskType: 'personal' | 'group'): Promise<boolean> {
		const user = await this.userRepository.findOne({
			where: { telegramId: userId }
		})

		if (!user) {
			return false
		}

		const presetType = taskType === 'personal' 
			? user.personalNotificationPreset 
			: user.groupNotificationPreset

		return presetType !== 'off'
	}
}