// Конфигурация пресетов уведомлений

// Типы пресетов уведомлений
export type NotificationPresetType = 'off' | 'minimal' | 'standard' | 'frequent' | 'maximum'

// Интерфейс пресета уведомлений
export interface NotificationPreset {
	name: string
	description: string
	intervals: Array<{
		name: string
		ms: number
	}>
}

const intervalsVariants = {
	'15m': { name: '15 минут', ms: 15 * 60 * 1000 },
	'30m': { name: '30 минут', ms: 30 * 60 * 1000 },
	'1h': { name: '1 час', ms: 60 * 60 * 1000 },
	'2h': { name: '2 часа', ms: 2 * 60 * 60 * 1000 },
	'3h': { name: '3 часа', ms: 3 * 60 * 60 * 1000 },
	'4h': { name: '4 часа', ms: 4 * 60 * 60 * 1000 },
	'6h': { name: '6 часов', ms: 6 * 60 * 60 * 1000 },
	'12h': { name: '12 часов', ms: 12 * 60 * 60 * 1000 },
	'1d': { name: '1 день', ms: 24 * 60 * 60 * 1000 },
	'3d': { name: '3 дня', ms: 3 * 24 * 60 * 60 * 1000 },
	'1w': { name: '1 неделя', ms: 7 * 24 * 60 * 60 * 1000 }
}

// Пресеты для личных задач
export const PERSONAL_NOTIFICATION_PRESETS: Record<NotificationPresetType, NotificationPreset> = {
	off: {
		name: 'Выключены',
		description: 'Уведомления отключены',
		intervals: []
	},
	
	minimal: {
		name: 'Минимальные',
		description: 'Только самые важные напоминания',
		intervals: [
			intervalsVariants['2h'],
			intervalsVariants['30m'],
		]
	},
	
	standard: {
		name: 'Стандартные',
		description: 'Сбалансированный набор уведомлений',
		intervals: [
			intervalsVariants['2h'],
			intervalsVariants['1h'],
			intervalsVariants['30m'],
			intervalsVariants['15m']
		]
	},
	
	frequent: {
		name: 'Частые',
		description: 'Много напоминаний для активного планирования',
		intervals: [
			intervalsVariants['4h'],
			intervalsVariants['3h'],
			intervalsVariants['2h'],
			intervalsVariants['1h'],
			intervalsVariants['30m'],
			intervalsVariants['15m'],
		]
	},
	
	maximum: {
		name: 'Максимальные',
		description: 'Все возможные напоминания для полного контроля',
		intervals: [
			intervalsVariants['1d'],
			intervalsVariants['12h'],
			intervalsVariants['6h'],
			intervalsVariants['4h'],
			intervalsVariants['3h'],
			intervalsVariants['2h'],
			intervalsVariants['1h'],
			intervalsVariants['30m'],
			intervalsVariants['15m']
		]
	}
}

// Пресеты для групповых задач (менее навязчивые)
export const GROUP_NOTIFICATION_PRESETS: Record<NotificationPresetType, NotificationPreset> = {
	off: {
		name: 'Выключены',
		description: 'Уведомления отключены',
		intervals: []
	},
	
	minimal: {
		name: 'Минимальные',
		description: 'Только критичные напоминания',
		intervals: [
			intervalsVariants['1d'],
			intervalsVariants['2h']
		]
	},
	
	standard: {
		name: 'Стандартные',
		description: 'Умеренное количество напоминаний',
		intervals: [
			intervalsVariants['3d'],
			intervalsVariants['1d'],
			intervalsVariants['4h']
		]
	},
	
	frequent: {
		name: 'Частые',
		description: 'Активные напоминания для команды',
		intervals: [
			intervalsVariants['1w'],
			intervalsVariants['3d'],
			intervalsVariants['1d'],
			intervalsVariants['12h'],
			intervalsVariants['4h'],
			intervalsVariants['2h']
		]
	},
	
	maximum: {
		name: 'Максимальные',
		description: 'Все напоминания для критичных проектов',
		intervals: [
			intervalsVariants['1w'],
			intervalsVariants['3d'],
			intervalsVariants['1d'],
			intervalsVariants['12h'],
			intervalsVariants['6h'],
			intervalsVariants['4h'],
			intervalsVariants['2h'],
			intervalsVariants['1h']
		]
	}
}

// Пресеты по умолчанию
export const DEFAULT_NOTIFICATION_PRESETS = {
	personal: 'frequent' as NotificationPresetType,
	group: 'frequent' as NotificationPresetType
}

// Утилиты для работы с пресетами
export class NotificationPresetUtils {
	/**
	 * Получает пресет для личных задач
	 */
	static getPersonalPreset(presetType: NotificationPresetType): NotificationPreset {
		return PERSONAL_NOTIFICATION_PRESETS[presetType]
	}

	/**
	 * Получает пресет для групповых задач
	 */
	static getGroupPreset(presetType: NotificationPresetType): NotificationPreset {
		return GROUP_NOTIFICATION_PRESETS[presetType]
	}

	/**
	 * Получает все доступные типы пресетов
	 */
	static getAvailablePresetTypes(): NotificationPresetType[] {
		return ['off', 'minimal', 'standard', 'frequent', 'maximum']
	}

	/**
	 * Валидирует тип пресета
	 */
	static isValidPresetType(presetType: string): presetType is NotificationPresetType {
		return this.getAvailablePresetTypes().includes(presetType as NotificationPresetType)
	}
}