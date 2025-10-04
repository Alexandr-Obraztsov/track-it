import TelegramBot from 'node-telegram-bot-api'
import { MessageProcessor } from './messageProcessor'
import { MessageFormatter } from './formatter'

/**
 * Сервис для обработки голосовых и текстовых сообщений
 * 
 * @description Упрощенный сервис-обертка для обработки сообщений от пользователей.
 * Отвечает за управление реакциями Telegram и делегирует основную логику
 * обработки в MessageProcessor.
 * 
 * @example
 * ```typescript
 * const voiceHandler = new VoiceHandlerService(messageProcessor)
 * await voiceHandler.handleMessage(bot, message)
 * ```
 */
export class VoiceHandlerService {
	private messageProcessor: MessageProcessor

	/**
	 * Создает экземпляр VoiceHandlerService
	 * 
	 * @param messageProcessor - Процессор сообщений для делегирования логики
	 */
	constructor(messageProcessor: MessageProcessor) {
		this.messageProcessor = messageProcessor
	}

	/**
	 * Универсальный метод обработки голосовых и текстовых сообщений
	 * 
	 * @description Обрабатывает входящие сообщения, управляет реакциями Telegram
	 * и делегирует основную логику обработки в MessageProcessor.
	 * 
	 * @param bot - Экземпляр Telegram бота
	 * @param msg - Сообщение для обработки
	 * 
	 * @example
	 * ```typescript
	 * await voiceHandler.handleMessage(bot, message)
	 * ```
	 */
	async handleMessage(bot: TelegramBot, msg: TelegramBot.Message): Promise<void> {
		const chatId = msg.chat.id.toString()
		const isVoiceMessage = !!msg.voice
		const isTextMessage = !!msg.text
		
		if (!isVoiceMessage && !isTextMessage) return

		try {
			// Ставим реакцию думающего смайлика для индикации обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🤔' }],
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

			// Обрабатываем сообщение через MessageProcessor
			const response = await this.messageProcessor.processMessage(bot, msg)

			// Отправляем ответ
			await bot.sendMessage(chatId, response, {
					reply_to_message_id: msg.message_id,
					parse_mode: 'HTML'
				})

			// Ставим реакцию галочки после успешной обработки
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '🍓' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

		} catch (error) {
			console.error('Error processing message:', error)

			// Ставим реакцию ошибки при неудачной обработке
			try {
				await bot.setMessageReaction(chatId, msg.message_id, {
					reaction: [{ type: 'emoji', emoji: '💔' }],
					is_big: false,
				})
			} catch (reactionError) {
				console.warn(MessageFormatter.ERRORS.GENERAL, reactionError)
			}

			await bot.sendMessage(chatId, MessageFormatter.ERRORS.GENERAL)
		}
	}
}