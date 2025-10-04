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
	 * Обработка аудио файла и извлечение задач с ролями
	 * 
	 * @description Обрабатывает голосовое сообщение через Gemini AI,
	 * извлекает задачи и операции для выполнения.
	 * 
	 * @param audioPath - Путь к аудио файлу
	 * @param author - Информация об авторе сообщения
	 * @param tasks - Существующие задачи
	 * @param roles - Существующие роли
	 * @param members - Участники чата
	 * @param isGroup - Флаг группового чата
	 * @returns Структурированный ответ от Gemini или сообщение об ошибке
	 */
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

			// Выбираем промпт в зависимости от типа чата
			const basePrompt = isGroup 
				? GEMINI_PROMPTS.AUDIO_TRANSCRIPTION 
				: GEMINI_PROMPTS.PERSONAL_TASK_ASSISTANT

			// Форматируем промпт с помощью PromptFormatter
			const prompt = PromptFormatter.formatPrompt(basePrompt, author, roles, tasks, members)

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

	/**
	 * Обработка текстового сообщения и извлечение задач с ролями
	 * 
	 * @description Обрабатывает текстовое сообщение через Gemini AI,
	 * извлекает задачи и операции для выполнения.
	 * 
	 * @param text - Текст сообщения
	 * @param author - Информация об авторе сообщения
	 * @param tasks - Существующие задачи
	 * @param roles - Существующие роли
	 * @param members - Участники чата
	 * @param isGroup - Флаг группового чата
	 * @returns Структурированный ответ от Gemini или сообщение об ошибке
	 */
	public async processText(
		text: string,
		author: GeminiUser,
		tasks: GeminiTask[] = [],
		roles: GeminiRole[] = [],
		members: GeminiChatMember[] = [],
		isGroup: boolean = true
	): Promise<AudioTranscriptionResponse | string> {
		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

			// Выбираем промпт в зависимости от типа чата
			const basePrompt = isGroup 
				? GEMINI_PROMPTS.AUDIO_TRANSCRIPTION 
				: GEMINI_PROMPTS.PERSONAL_TASK_ASSISTANT

			// Форматируем промпт с помощью PromptFormatter
			const prompt = PromptFormatter.formatPrompt(basePrompt, author, roles, tasks, members, text)

			const result = await model.generateContent(prompt)
			const responseText = result.response.text()

			// Очищаем текст от markdown код-блоков перед парсингом JSON
			const cleanedText = responseText
				.replace(/```json\n?/g, '')
				.replace(/```/g, '')
				.trim()

			// Парсим JSON
			const parsedResponse: AudioTranscriptionResponse = JSON.parse(cleanedText)

			return parsedResponse
		} catch (error) {
			console.error('Error processing text with Gemini:', error)
			return MessageFormatter.ERRORS.GENERAL
		}
	}
}
