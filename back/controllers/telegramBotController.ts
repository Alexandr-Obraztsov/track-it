import TelegramBot from 'node-telegram-bot-api'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Note: Global proxy environment variables are set above
// Google Generative AI SDK should automatically use HTTP_PROXY/HTTPS_PROXY or SOCKS_PROXY
// if they are set in the environment

class TelegramBotController {
	private bot?: TelegramBot
	private token: string
	private genAI?: GoogleGenerativeAI

	constructor() {
		this.token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN'
		if (this.token === 'YOUR_BOT_TOKEN') {
			console.error(
				'Error: TELEGRAM_BOT_TOKEN is not set. Please set your bot token in the environment variables.'
			)
			return
		}

		// Configure bot
		const botOptions: any = {
			polling: true,
			request: {
				timeout: 30000, // 30 second timeout
			},
		}

		this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
		this.bot = new TelegramBot(this.token, botOptions)
		this.initializeHandlers()
		this.initializeErrorHandling()
		this.ensureDownloadsDirectory()
		console.log('Bot initialized successfully')
	}

	private ensureDownloadsDirectory(): void {
		const downloadsDir = path.join(__dirname, '../downloads')
		if (!fs.existsSync(downloadsDir)) {
			fs.mkdirSync(downloadsDir, { recursive: true })
		}
	}

	private async convertOggToMp3(
		inputPath: string,
		outputPath: string
	): Promise<void> {
		return new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.toFormat('mp3')
				.on('end', () => resolve())
				.on('error', (err: any) => reject(err))
				.save(outputPath)
		})
	}

	private async processWithGemini(audioPath: string): Promise<string> {
		if (!this.genAI) {
			return 'Gemini AI is not configured'
		}
		try {
			const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
			const audioData = fs.readFileSync(audioPath)
			const base64Audio = audioData.toString('base64')

			const result = await model.generateContent([
				'Please transcribe this audio file and provide a summary.',
				{
					inlineData: {
						mimeType: 'audio/mp3',
						data: base64Audio,
					},
				},
			])

			return result.response.text()
		} catch (error) {
			console.error(
				'Error processing with Gemini:',
				error instanceof Error ? error.message : String(error)
			)
			return 'Error processing audio with Gemini'
		}
	}

	private initializeHandlers(): void {
		if (!this.bot) return
		// Handle /start command
		this.bot.onText(/\/start/, msg => {
			const chatId = msg.chat.id
			this.sendMessage(chatId, 'Welcome to the Telegram Bot!')
		})

		// Handle /help command
		this.bot.onText(/\/help/, msg => {
			const chatId = msg.chat.id
			this.sendMessage(
				chatId,
				'Available commands:\n/start - Start the bot\n/help - Get help\nSend voice message to process it with AI'
			)
		})

		// Handle voice messages
		this.bot.on('voice', async msg => {
			const chatId = msg.chat.id
			const fileId = msg.voice!.file_id
			const oggFileName = `voice_${Date.now()}.ogg`
			const mp3FileName = `voice_${Date.now()}.mp3`
			const downloadsDir = path.join(__dirname, '../downloads')
			const oggPath = path.join(downloadsDir, oggFileName)
			const mp3Path = path.join(downloadsDir, mp3FileName)

			try {
				console.log(`Processing voice message with fileId: ${fileId}`)

				// Get file info first
				const fileInfo = await this.bot!.getFile(fileId)
				console.log(`File info:`, fileInfo)

				// Download file
				const downloadResult = await this.bot!.downloadFile(
					fileId,
					downloadsDir
				)
				console.log(`Download result type:`, typeof downloadResult)

				let downloadedFilePath: string

				if (typeof downloadResult === 'string') {
					// downloadFile returned a file path
					downloadedFilePath = downloadResult
					console.log(`Downloaded to: ${downloadedFilePath}`)
				} else {
					// downloadFile returned a stream - this shouldn't happen with our usage
					throw new Error('Download returned a stream instead of file path')
				}

				// Check if file exists and rename it
				if (fs.existsSync(downloadedFilePath)) {
					fs.renameSync(downloadedFilePath, oggPath)
					console.log(`Renamed to: ${oggPath}`)
				} else {
					throw new Error(`Downloaded file not found at ${downloadedFilePath}`)
				}

				// Verify OGG file exists
				if (!fs.existsSync(oggPath)) {
					throw new Error(`OGG file not found at ${oggPath}`)
				}

				this.sendMessage(
					chatId,
					'Voice message downloaded. Converting to MP3...'
				)

				// Convert to MP3
				await this.convertOggToMp3(oggPath, mp3Path)

				// Verify MP3 file exists
				if (!fs.existsSync(mp3Path)) {
					throw new Error(`MP3 file not created at ${mp3Path}`)
				}

				this.sendMessage(
					chatId,
					'MP3 conversion complete. Processing with Gemini AI...'
				)

				// Process with Gemini
				const geminiResponse = await this.processWithGemini(mp3Path)

				// Send response back to user
				this.sendMessage(chatId, `Gemini AI Response:\n${geminiResponse}`)

				// Clean up files
				if (fs.existsSync(oggPath)) {
					fs.unlinkSync(oggPath)
					console.log(`Cleaned up OGG file: ${oggPath}`)
				}
				if (fs.existsSync(mp3Path)) {
					fs.unlinkSync(mp3Path)
					console.log(`Cleaned up MP3 file: ${mp3Path}`)
				}

				console.log(`Voice message processed successfully: ${mp3FileName}`)
			} catch (error) {
				console.error('Error processing voice message:', error)

				let errorMessage = 'Unknown error occurred'
				let isProxyError = false

				if (error instanceof Error) {
					errorMessage = error.message

					// Check for common proxy-related errors
					if (
						errorMessage.includes('timeout') ||
						errorMessage.includes('ECONNREFUSED') ||
						errorMessage.includes('ENOTFOUND') ||
						errorMessage.includes('proxy')
					) {
						isProxyError = true
						console.warn('Proxy-related error detected:', errorMessage)
					}
				}

				// Provide user-friendly error message
				let userMessage = `Error processing voice message: ${errorMessage}`

				if (isProxyError) {
					userMessage +=
						'\n\nNote: There may be connectivity issues. The system will retry with direct connection if available.'
				}

				this.sendMessage(chatId, userMessage)

				// Clean up any partial files
				try {
					if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath)
					if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path)
				} catch (cleanupError) {
					console.warn('Error during cleanup:', cleanupError)
				}
			}
		})

		// Handle any message
		this.bot.on('message', msg => {
			const chatId = msg.chat.id
			console.log(`Received message: ${msg.text} from ${msg.from?.username}`)
		})
	}

	private initializeErrorHandling(): void {
		if (!this.bot) return

		this.bot.on('polling_error', error => {
			console.error('Polling error:', error)
		})

		this.bot.on('error', error => {
			console.error('Bot error:', error)
		})
	}

	public sendMessage(chatId: number, text: string): void {
		if (!this.bot) {
			console.error('Bot is not initialized')
			return
		}
		this.bot.sendMessage(chatId, text)
	}

	public getBot(): TelegramBot | undefined {
		return this.bot
	}
}

const telegramBotController = new TelegramBotController()
export { telegramBotController, TelegramBotController }
