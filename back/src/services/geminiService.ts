import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import { GEMINI_PROMPTS } from '../configs/geminiPrompts'

// Интерфейс задачи
export interface Task {
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    deadline: string | null
}

// Интерфейс ответа от Gemini
export interface AudioTranscriptionResponse {
    tasks: Task[]
}

// Сервис для работы с Gemini AI
export class GeminiService {
    private genAI: GoogleGenerativeAI

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey)
    }

    // Обработка аудио файла и извлечение задач
    public async processAudio(audioPath: string): Promise<AudioTranscriptionResponse | string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const audioData = fs.readFileSync(audioPath)
            const base64Audio = audioData.toString('base64')

            // Подставляем текущее время в промпт
            const currentTime = new Date().toLocaleString('ru-RU')
            const prompt = GEMINI_PROMPTS.AUDIO_TRANSCRIPTION.replace('{currentTime}', currentTime)

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
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

            // Пытаемся распарсить JSON
            try {
                const parsedResponse = JSON.parse(cleanedText) as AudioTranscriptionResponse
                return parsedResponse
            } catch (parseError) {
                console.warn('Не удалось распарсить ответ Gemini как JSON, возвращаем сырой текст')
                return responseText
            }
        } catch (error) {
            console.error(
                'Ошибка обработки аудио с Gemini:',
                error instanceof Error ? error.message : String(error)
            )
            return 'Ошибка обработки аудио с Gemini'
        }
    }
}