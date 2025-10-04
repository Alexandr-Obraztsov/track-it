/**
 * Форматтер для всех текстовых сообщений системы
 * Содержит все строки, которые отображаются пользователю
 * Централизует локализацию и управление текстом
 */
export class MessageFormatter {
	// ========== ОШИБКИ СИСТЕМЫ ==========
	
	static readonly ERRORS = {
		GENERAL: '❌ Ошибка',
		UNAVAILABLE: '❌ Недоступно',
		NOT_FOUND: '❌ Не найдено'
	}

	// ========== УСПЕШНЫЕ ОПЕРАЦИИ ==========
	
	static readonly SUCCESS = {
		COMPLETED: '✅ Готово',
		NEW_TASKS: (tasks: number) => `<b>✨ Созданы новые задачи (${tasks}):</b>`,
		REGISTERED: '✅ Зарегистрирован'
	}

	// ========== ИНФОРМАЦИОННЫЕ СООБЩЕНИЯ ==========
	
	static readonly INFO = {
		PRIVATE_OK: 'В личных сообщениях регистрация не требуется!',
		GROUPS_ONLY: '❌ Только в группах',
		UNKNOWN: '❌ Неизвестно'
	}

	// ========== СООБЩЕНИЯ БОТА ==========
	
	static readonly BOT_MESSAGES = {
		WELCOME: '🎉 Привет! Я голосовой бот для управления задачами!',
		VOICE_INSTRUCTIONS: '🎙️ Отправьте голосовое сообщение!',
		NATURAL_SPEECH: '✨ Говорите естественно!',
		ADMIN_OK: '✅ Права администратора есть!',
		ADMIN_NEED: '⚠️ Нужны права администратора',
		REGISTER_BUTTON: '👤 Зарегистрироваться',
		PINNED: '📌 Закреплено!',
		ADMIN_THANKS: '🎉 Спасибо!',
		ADMIN_FULL: 'Теперь работаю полноценно.',
		ADMIN_WELCOME_PINNED: '🎉 Отлично! Права есть.\n📌 Закреплено!',
		VOICE_NOT_FOUND: 'Не нашел голосовое 🤷‍♂️',
		START_COMMAND: 'Привет! Я бот для управления задачами.\n\n🎙️ Отправьте голосовое!',
		SERVER_WORKING: 'Сервер работает!',
		SYSTEM_MESSAGE: '[системное сообщение]'
	}

	// ========== ПРИВЕТСТВИЯ ==========
	
	static readonly WELCOME = {
		NEW_MEMBER: (userTag: string) => `👋 Привет, ${userTag}!\n\n✅ Зарегистрирован.\n🎙️ Отправьте голосовое!`,
		AUTO_REGISTERED: (userTag: string) => `✅ ${userTag} зарегистрирован!`
	}

	// ========== ПРЕСЕТЫ УВЕДОМЛЕНИЙ ==========
	
	static readonly NOTIFICATION_PRESETS = {
		INTERVALS: {
			'15m': '15 минут',
			'30m': '30 минут',
			'1h': '1 час',
			'2h': '2 часа',
			'3h': '3 часа',
			'4h': '4 часа',
			'6h': '6 часов',
			'12h': '12 часов',
			'1d': '1 день',
			'3d': '3 дня',
			'1w': '1 неделя'
		},
		PERSONAL_NAMES: {
			off: 'Выключены',
			minimal: 'Минимальные',
			standard: 'Стандартные',
			frequent: 'Частые',
			maximum: 'Максимальные'
		},
		PERSONAL_DESCRIPTIONS: {
			off: 'Уведомления отключены',
			minimal: 'Только самые важные напоминания',
			standard: 'Сбалансированный набор уведомлений',
			frequent: 'Много напоминаний для активного планирования',
			maximum: 'Все возможные напоминания для полного контроля'
		},
		GROUP_DESCRIPTIONS: {
			off: 'Уведомления отключены',
			minimal: 'Только критичные напоминания',
			standard: 'Умеренное количество напоминаний',
			frequent: 'Активные напоминания для команды',
			maximum: 'Все напоминания для критичных проектов'
		}
	}

	// ========== ДАННЫЕ ДЛЯ GEMINI ==========
	
	static readonly GEMINI_DATA = {
		USERS_ABSENT: 'Пользователи отсутствуют',
		ROLES_ABSENT: 'Роли отсутствуют',
		TASKS_ABSENT: 'Задачи отсутствуют',
		MEMBERS_ABSENT: 'отсутствуют',
		DEADLINE_NOT_SET: 'не указан',
		NOT_ASSIGNED: 'не назначена',
		COMPLETED_YES: 'да',
		COMPLETED_NO: 'нет'
	}

	// ========== ВАРИАНТЫ ТЕКСТОВ ==========
	
	static readonly VARIANTS = {
		UNKNOWN: 'Неизвестный',
		NO_ROLE: 'без роли',
		PERSONAL: 'Личная',
		GROUP: 'Групповая',
		COMPLETED: 'выполнена',
		IN_PROGRESS: 'в работе',
		OVERDUE: '🔴 Просрочена',
		TOMORROW: '🟡 Завтра',
		TASKS_EMPTY: 'Задач нет'
	}

	// ========== МНОЖЕСТВЕННЫЕ ФОРМЫ ==========
	
	static readonly PLURAL = {
		MEMBER: {
			ONE: 'участник',
			FEW: 'участника',
			MANY: 'участников'
		}
	}

	/**
	 * Получает правильную форму слова для количества
	 */
	static getPluralForm(count: number, forms: { ONE: string; FEW: string; MANY: string }): string {
		const lastDigit = count % 10
		const lastTwoDigits = count % 100

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			return forms.MANY
		}

		if (lastDigit === 1) {
			return forms.ONE
		}

		if (lastDigit >= 2 && lastDigit <= 4) {
			return forms.FEW
		}

		return forms.MANY
	}

	/**
	 * Получает правильную форму для участников
	 */
	static getMemberPlural(count: number): string {
		return this.getPluralForm(count, this.PLURAL.MEMBER)
	}

	// ========== СТАТУСЫ ЗАДАЧ ==========
	
	static readonly TASK_STATUS = {
		OVERDUE: '🔴 Просрочена',
		TOMORROW: '🟡 Завтра',
		COMPLETED: 'выполнена',
		IN_PROGRESS: 'в работе'
	}

	/**
	 * Получает текст статуса задачи
	 */
	static getTaskStatusText(isCompleted: boolean, deadline?: Date): string {
		if (isCompleted) {
			return this.TASK_STATUS.COMPLETED
		}
		
		if (deadline) {
			const now = new Date()
			const timeDiff = deadline.getTime() - now.getTime()
			
			if (timeDiff <= 0) {
				return this.TASK_STATUS.OVERDUE
			}
		}
		
		return this.TASK_STATUS.IN_PROGRESS
	}
}
