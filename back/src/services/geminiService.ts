import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import { GEMINI_PROMPTS } from '../configs/geminiPrompts'
import { GeminiUser, GeminiTask, GeminiRole, GeminiChatMember, AudioTranscriptionResponse } from '../types'
import { MessageFormatter, PromptFormatter } from './formatter'

/**
 * Сервис для работы с Gemini AI
 * 
 * @description Сервис для взаимодействия с Google Gemini AI API.
 * Обрабатывает голосовые и текстовые сообщения, форматирует промпты
 * и возвращает структурированные ответы для управления задачами.
 * 
 * @example
 * ```typescript
 * const geminiService = new GeminiService(apiKey)
 * const result = await geminiService.processAudio(audioPath, author, tasks, roles, members, isGroup)
 * ```
 */
export class GeminiService {
	private genAI: GoogleGenerativeAI

	/**
	 * Создает экземпляр GeminiService
	 * 
	 * @param apiKey - API ключ для Google Gemini AI
	 */
	constructor(apiKey: string) {
		this.genAI = new GoogleGenerativeAI(apiKey)
	}

	/**
	 * Универсальная обработка сообщений (голосовых и текстовых)
	 * 
	 * @description Обрабатывает голосовые и текстовые сообщения через Gemini AI,
	 * извлекает задачи и операции для выполнения.
	 * 
	 * @param input - Путь к аудио файлу или текстовое сообщение
	 * @param author - Информация об авторе сообщения
	 * @param tasks - Существующие задачи
	 * @param roles - Существующие роли
	 * @param members - Участники чата
	 * @param isGroup - Флаг группового чата
	 * @param isAudio - Флаг, указывающий является ли вход аудио файлом
	 * @returns Структурированный ответ от Gemini или сообщение об ошибке
	 */
	public async processMessage(
		input: string,
		author: GeminiUser,
		tasks: GeminiTask[] = [],
		roles: GeminiRole[] = [],
		members: GeminiChatMember[] = [],
		isGroup: boolean = true,
		isAudio: boolean = false
	): Promise<AudioTranscriptionResponse | string> {
		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

			// Выбираем промпт в зависимости от типа чата
			const basePrompt = isGroup 
				? GEMINI_PROMPTS.AUDIO_TRANSCRIPTION 
				: GEMINI_PROMPTS.PERSONAL_TASK_ASSISTANT

			// Форматируем промпт с помощью PromptFormatter
			const prompt = PromptFormatter.formatPrompt(basePrompt, author, roles, tasks, members)

			let result

			if (isAudio) {
				// Обработка аудио файла
				const audioData = fs.readFileSync(input)
				const base64Audio = audioData.toString('base64')

				result = await model.generateContent([
					prompt,
					{
						inlineData: {
							mimeType: 'audio/mp3',
							data: base64Audio,
						},
					},
				])
			} else {
				// Обработка текстового сообщения
				result = await model.generateContent([
					prompt,
					{
						text: `Пользователь написал: "${input}"`
					}
				])
			}

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
