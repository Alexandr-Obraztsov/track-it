import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import { GEMINI_PROMPTS } from '../configs/geminiPrompts'

// Интерфейс роли
export interface Role {
    name: string
}

// Интерфейс задачи
export interface Task {
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    deadline: string | null
    assignedToUser?: string | null
    assignedToRole?: string | null
}

// Интерфейс участника группы
export interface GroupMember {
    name: string
    username?: string
}

// Интерфейс операции с задачей
export interface TaskOperation {
    operation: 'delete' | 'update' | 'complete'
    taskId: string
    updateData?: {
        title?: string
        description?: string
        priority?: 'high' | 'medium' | 'low'
        deadline?: string | null
        assignedToUser?: string | null
        assignedToRole?: string | null
        isCompleted?: boolean
    }
}

// Интерфейс операции с ролью
export interface RoleOperation {
    operation: 'create' | 'update' | 'delete' | 'assign' | 'unassign'
    roleName: string
    newRoleName?: string // Для операции update
    targetUser?: string // Для операций assign/unassign
}

// Интерфейс существующей роли для передачи в Gemini
export interface ExistingRole {
    id: number
    name: string
    membersCount: number
    members: string[] // Список пользователей с этой ролью
}

// Интерфейс существующей задачи для передачи в Gemini
export interface ExistingTask {
    id: number
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    deadline: string | null
    assignedToUser?: string | null
    assignedToRole?: string | null
    isCompleted: boolean
}

// Интерфейс команды бота
export interface BotCommand {
    command: string
    reason: string
}

// Интерфейс ответа от Gemini
export interface AudioTranscriptionResponse {
    roles: Role[]
    tasks: Task[]
    taskOperations?: TaskOperation[]
    roleOperations?: RoleOperation[]
    commands?: BotCommand[]
}

// Сервис для работы с Gemini AI
export class GeminiService {
    private genAI: GoogleGenerativeAI

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey)
    }

    // Обработка аудио файла и извлечение задач с ролями
    public async processAudio(audioPath: string, members: GroupMember[] = [], existingTasks: ExistingTask[] = [], userRole: string | null = null, existingRoles: ExistingRole[] = []): Promise<AudioTranscriptionResponse | string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const audioData = fs.readFileSync(audioPath)
            const base64Audio = audioData.toString('base64')

            // Подставляем текущее время, список участников, роль пользователя, роли и задач в промпт
            const currentTime = new Date().toLocaleString('ru-RU')
            const membersString = members.length > 0 
                ? members.map(m => m.username ? `${m.name} (@${m.username})` : m.name).join(', ')
                : 'Участники не указаны'
            
            const userRoleString = userRole || 'Обычный пользователь'
            
            const rolesString = existingRoles.length > 0
                ? existingRoles.map(r => 
                    `ID: ${r.id}, Название: ${r.name}, Участников: ${r.membersCount}, ` +
                    `Пользователи: ${r.members.length > 0 ? r.members.join(', ') : 'отсутствуют'}`
                  ).join('\n')
                : 'Роли отсутствуют'
            
            const tasksString = existingTasks.length > 0
                ? existingTasks.map(t => 
                    `ID: ${t.id}, Название: ${t.title}, Описание: ${t.description}, Приоритет: ${t.priority}, ` +
                    `Дедлайн: ${t.deadline || 'не указан'}, Назначена: ${t.assignedToUser || t.assignedToRole || 'не назначена'}, ` +
                    `Выполнена: ${t.isCompleted ? 'да' : 'нет'}`
                  ).join('\n')
                : 'Задачи отсутствуют'
            
            let prompt = GEMINI_PROMPTS.AUDIO_TRANSCRIPTION
                .replace('{currentTime}', currentTime)
                .replace('{members}', membersString)
                .replace('{userRole}', userRoleString)
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

    // Извлечение задач из аудио (для обратной совместимости)
    public async extractTasksFromAudio(audioPath: string, members: GroupMember[] = [], existingTasks: ExistingTask[] = []): Promise<Task[]> {
        const result = await this.processAudio(audioPath, members, existingTasks, null, [])
        
        if (typeof result === 'string') {
            return []
        }
        
        return result.tasks || []
    }

    // Извлечение ролей из аудио
    public async extractRolesFromAudio(audioPath: string, members: GroupMember[] = [], existingTasks: ExistingTask[] = []): Promise<Role[]> {
        const result = await this.processAudio(audioPath, members, existingTasks, null, [])
        
        if (typeof result === 'string') {
            return []
        }
        
        return result.roles || []
    }

    // Извлечение операций с задачами из аудио
    public async extractTaskOperationsFromAudio(audioPath: string, members: GroupMember[] = [], existingTasks: ExistingTask[] = []): Promise<TaskOperation[]> {
        const result = await this.processAudio(audioPath, members, existingTasks, null, [])
        
        if (typeof result === 'string') {
            return []
        }
        
        return result.taskOperations || []
    }
}