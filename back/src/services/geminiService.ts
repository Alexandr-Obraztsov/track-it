import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import { GEMINI_PROMPTS } from '../configs/geminiPrompts'
import { GeminiUser, GeminiTask, GeminiRole, GeminiChatMember, AudioTranscriptionResponse } from '../types'
import { MessageFormatter } from './formatter'

// Сервис для работы с Gemini AI
export class GeminiService {
	private genAI: GoogleGenerativeAI

	constructor(apiKey: string) {
		this.genAI = new GoogleGenerativeAI(apiKey)
	}

	// Обработка аудио файла и извлечение задач с ролями
	public async processAudio(
		audioPath: string,
		author: GeminiUser,
		tasks: GeminiTask[] = [],
		roles: GeminiRole[] = [],
		members: GeminiChatMember[] = [],
		isGroup: boolean = true
	): Promise<AudioTranscriptionResponse | string> {
		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
			const audioData = fs.readFileSync(audioPath)
			const base64Audio = audioData.toString('base64')

			// Подставляем текущее время, автора, список пользователей, роли и задачи в промпт
			const currentTime = new Date().toString()

			// Форматируем автора запроса
			const authorString = `ID: ${author.telegramId}, Имя: ${author.firstName} ${author.lastName || ''}, Username: @${author.username}`

			// Форматируем участников чата
			const membersString =
				members.length > 0
					? members
							.map(
								m =>
									`ID: ${m.userId}, Имя: ${m.firstName} ${m.lastName || ''}, Username: @${m.username}, Роль: ${m.roleName || 'Без роли'}`
							)
							.join('\n')
					: MessageFormatter.GEMINI_DATA.USERS_ABSENT

			// Форматируем роли
			const rolesString =
				roles.length > 0
					? roles
							.map(
								r =>
									`ID: ${r.id}, Название: ${r.name}, Участников: ${r.memberIds.length}, ` +
									`Пользователи: ${r.memberIds.length > 0 ? r.memberIds.join(', ') : MessageFormatter.GEMINI_DATA.USERS_ABSENT}`
							)
							.join('\n')
					: MessageFormatter.GEMINI_DATA.ROLES_ABSENT

			// Форматируем задачи
			const tasksString =
				tasks.length > 0
					? tasks
							.map(
								t =>
									`ID: ${t.id}, Читаемый ID: ${t.readableId}, Название: ${t.title}, Описание: ${t.description}, ` +
									`Дедлайн: ${t.deadline || MessageFormatter.GEMINI_DATA.DEADLINE_NOT_SET}, ` +
									`Назначена на пользователя: ${t.assignedUserId || MessageFormatter.GEMINI_DATA.NOT_ASSIGNED}, ` +
									`Назначена на роль: ${t.assignedRoleId || MessageFormatter.GEMINI_DATA.NOT_ASSIGNED}, ` +
									`Выполнена: ${t.isCompleted ? MessageFormatter.GEMINI_DATA.COMPLETED_YES : MessageFormatter.GEMINI_DATA.COMPLETED_NO}`
							)
							.join('\n')
					: MessageFormatter.GEMINI_DATA.TASKS_ABSENT

			// Выбираем промпт в зависимости от типа чата
			const basePrompt = isGroup 
				? GEMINI_PROMPTS.AUDIO_TRANSCRIPTION 
				: GEMINI_PROMPTS.PERSONAL_TASK_ASSISTANT

			let prompt = basePrompt.replace('{currentTime}', currentTime)
				.replace('{author}', authorString)
				.replace('{roles}', rolesString)
				.replace('{tasks}', tasksString)
				.replace('{chatMembers}', membersString)

			const result = await model.generateContent([
				prompt,
				{
					inlineData: {
						mimeType: 'audio/mp3',
						data: base64Audio,
					},
				},
			])

			const responseText = result.response.text()


			// Очищаем текст от markdown код-блоков перед парсингом JSON
			const cleanedText = responseText
				.replace(/```json\n?/g, '')
				.replace(/```\n?/g, '')
				.trim()

			// Пытаемся распарсить JSON
			try {
				const parsedResponse = JSON.parse(cleanedText) as AudioTranscriptionResponse
				return parsedResponse
			} catch (parseError) {
				console.warn(MessageFormatter.ERRORS.GENERAL)
				return responseText
			}
		} catch (error) {
		console.error(MessageFormatter.ERRORS.GENERAL, error instanceof Error ? error.message : String(error))
		return MessageFormatter.ERRORS.GENERAL
		}
	}
}
