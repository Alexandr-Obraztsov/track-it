import TelegramBot from 'node-telegram-bot-api'

export class BotMentionUtils {
	/**
	 * Проверяет, упомянут ли бот в сообщении
	 * @param msg - сообщение Telegram
	 * @param botUsername - username бота (без @)
	 * @returns true если бот упомянут или сообщение является ответом на сообщение бота
	 */
	public static async isBotMentioned(bot: TelegramBot, msg: TelegramBot.Message): Promise<boolean> {
		const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup'
		const botUser = await bot.getMe()
		// В личных сообщениях всегда обрабатываем
		if (!isGroup) {
			return true
		}

		// Проверяем ответ на сообщение бота
		if (msg.reply_to_message && msg.reply_to_message.from?.id === botUser.id) {
			return true
		}

		// Проверяем упоминание через entities
		const hasBotMention = msg.entities?.some(
			entity =>
				entity.type === 'mention' &&
				msg.text?.substring(entity.offset, entity.offset + entity.length) === `@${botUser.username}`
		)
		if (hasBotMention) {
			return true
		}

		return false
	}
}
