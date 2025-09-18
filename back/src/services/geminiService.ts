import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import { GEMINI_PROMPTS } from '../configs/geminiPrompts'
import { GeminiUser, GeminiTask, GeminiRole, AudioTranscriptionResponse } from '../types'

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
        users: GeminiUser[] = [], 
        tasks: GeminiTask[] = [], 
        roles: GeminiRole[] = []
    ): Promise<AudioTranscriptionResponse | string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const audioData = fs.readFileSync(audioPath)
            const base64Audio = audioData.toString('base64')

            // Подставляем текущее время, автора, список пользователей, роли и задачи в промпт
            const currentTime = new Date().toLocaleString('ru-RU')
            
            // Форматируем автора запроса
            const authorString = `ID: ${author.telegramId}, Имя: ${author.firstName} ${author.lastName || ''}, Username: @${author.username}`
            
            // Форматируем пользователей
            const usersString = users.length > 0 
                ? users.map(u => `ID: ${u.telegramId}, Имя: ${u.firstName} ${u.lastName || ''}, Username: @${u.username}`).join('\n')
                : 'Пользователи отсутствуют'
            
            // Форматируем роли
            const rolesString = roles.length > 0
                ? roles.map(r => 
                    `ID: ${r.id}, Название: ${r.name}, Участников: ${r.memberIds.length}, ` +
                    `Пользователи: ${r.memberIds.length > 0 ? r.memberIds.join(', ') : 'отсутствуют'}`
                  ).join('\n')
                : 'Роли отсутствуют'
            
            // Форматируем задачи
            const tasksString = tasks.length > 0
                ? tasks.map(t => 
                    `ID: ${t.id}, Читаемый ID: ${t.readableId}, Название: ${t.title}, Описание: ${t.description}, ` +
                    `Приоритет: ${t.priority}, Дедлайн: ${t.deadline || 'не указан'}, ` +
                    `Назначена на пользователя: ${t.assignedUserId || 'не назначена'}, ` +
                    `Назначена на роль: ${t.assignedRoleId || 'не назначена'}, ` +
                    `Выполнена: ${t.isCompleted ? 'да' : 'нет'}`
                  ).join('\n')
                : 'Задачи отсутствуют'
            
            let prompt = GEMINI_PROMPTS.AUDIO_TRANSCRIPTION
                .replace('{currentTime}', currentTime)
                .replace('{author}', authorString)
                .replace('{users}', usersString)
                .replace('{roles}', rolesString)
                .replace('{tasks}', tasksString)

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

            console.log('Запрос в Gemini:', prompt)
            console.log('Ответ Gemini:', responseText)

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