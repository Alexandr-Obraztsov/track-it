import { Chat } from '../entities/Chat';
import { User } from '../entities/User';
import { Task as TaskEntity } from '../entities/Task';

export const GEMINI_PROMPTS = {
  // Промпт для извлечения групповых задач из текста/аудио
  extractGroupTasks: (text: string, currentTime: Date, chat: Chat, existingTasks: TaskEntity[] = []): string => {
    const usersInfo = chat.userChatRoles?.map(ucr => ({
      id: ucr.user.id,
      username: ucr.user.username,
      firstName: ucr.user.firstName,
      lastName: ucr.user.lastName || null,
      role: ucr.role?.title || null
    })) || [];

    const rolesInfo = chat.chatRoles?.map(cr => ({
      id: cr.role.id,
      title: cr.role.title,
      createdAt: cr.role.createdAt ? new Date(cr.role.createdAt).toISOString() : null
    })) || [];

    const existingTasksInfo = existingTasks.length > 0 
      ? existingTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || null,
          assignedUserId: task.assignedUserId || null,
          assignedRoleId: task.assignedRoleId || null,
          deadline: task.deadline ? (task.deadline instanceof Date ? task.deadline.toISOString().split('T')[0] : task.deadline) : null
        }))
      : [];

    return `Извлечение задач из сообщения пользователя.

КОНТЕКСТ:
- Время: ${currentTime.toISOString()}
- Чат: "${chat.title}" (ID: ${chat.id})
- Участники: ${JSON.stringify(usersInfo, null, 2)}
- Роли: ${JSON.stringify(rolesInfo, null, 2)}
- Существующие задачи: ${JSON.stringify(existingTasksInfo, null, 2)}

СООБЩЕНИЕ: "${text}"

ПРАВИЛА:
1. **УМНОЕ ОБНОВЛЕНИЕ**: Если пользователь уточняет, дополняет или изменяет существующую задачу - ОБНОВЛЯЙ её, а не создавай новую
2. **НОВЫЕ ЗАДАЧИ**: Создавай только для действительно новых идей/планов
3. **РАЗБИВКА**: Сложные задачи разбивай на подзадачи
4. **КРАТКОСТЬ**: Заголовок 2-3 слова, описание только при необходимости
5. **ДЕДЛАЙНЫ**: 
   - "До 30 ноября" = 30.11.2025 23:59 (включительно)
   - "До 30 ноября не включительно" = 29.11.2025 23:59 (исключительно)
   - Если время не указано = 00:00 (не отображается)
   - Анализируй контекст: включительно или исключительно
6. **ОБНОВЛЕНИЯ**: Обновляй только те поля, которые действительно изменились. Если заголовок тот же - НЕ указывай title

ПРИМЕРЫ УМНОГО ОБНОВЛЕНИЯ:
- "Кстати, API нужно сделать REST" → обновить title: "Создать REST API"
- "Добавь к задаче про дизайн - нужно учесть мобильную версию" → обновить description
- "Перенеси дедлайн на завтра" → обновить deadline
- "Назначь это на Ивана" → обновить assignedUserId
- "Купить машину до 30 ноября" → обновить только deadline: "2024-11-30T23:59:59+03:00" (title не меняется!)
- "Купить машину до 30 ноября не включительно" → обновить только deadline: "2024-11-29T23:59:59+03:00" (title не меняется!)

ПРИМЕРЫ НОВЫХ ЗАДАЧ:
- "Еще нужно протестировать" → новая задача
- "А что с документацией?" → новая задача
- "Хорошо бы добавить логи" → новая задача

ПРИМЕРЫ ДЕДЛАЙНОВ:
- "1 ноября" → "2024-11-01T00:00:00+03:00" (начало дня, время не отображается)
- "Завтра в 15:00" → "2024-01-16T15:00:00+03:00" (конкретное время)
- "До 30 ноября" → "2024-11-30T23:59:59+03:00" (включительно)
- "До 30 ноября не включительно" → "2024-11-29T23:59:59+03:00" (исключительно)
- "До конца года" → "2024-12-31T23:59:59+03:00" (включительно)

ФОРМАТ ОТВЕТА (только JSON):
{
  "newTasks": [
    {
      "title": "Краткий заголовок",
      "description": "Подробности (если нужны)",
      "assignedUserId": number | null,
      "assignedRoleId": number | null,
      "deadline": "YYYY-MM-DDTHH:mm:ss+03:00" | null
    }
  ],
  "updatedTasks": [
    {
      "id": number, // ТОЛЬКО ID из существующих задач
      "title": "новое название" | null, // ТОЛЬКО если название действительно изменилось
      "description": "новое описание" | null, // ТОЛЬКО если описание изменилось
      "assignedUserId": number | null, // ТОЛЬКО если назначение изменилось
      "assignedRoleId": number | null, // ТОЛЬКО если роль изменилась
      "deadline": "YYYY-MM-DDTHH:mm:ss+03:00" | null // ТОЛЬКО если дедлайн изменился
    }
  ]
}`;
  },

  // Промпт для извлечения личных задач из текста/аудио
  extractPersonalTasks: (text: string, currentTime: Date, user: User, existingTasks: TaskEntity[] = []): string => {
    const existingTasksInfo = existingTasks.length > 0
      ? existingTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || null,
          assignedUserId: task.assignedUserId || null,
          assignedRoleId: task.assignedRoleId || null,
          deadline: task.deadline ? (task.deadline instanceof Date ? task.deadline.toISOString().split('T')[0] : task.deadline) : null
        }))
      : [];

    return `Извлечение личных задач из сообщения пользователя.

КОНТЕКСТ:
- Время: ${currentTime.toISOString()}
- Пользователь: ${user.firstName} ${user.lastName || ''} (@${user.username})
- Существующие задачи: ${JSON.stringify(existingTasksInfo, null, 2)}

СООБЩЕНИЕ: "${text}"

ПРАВИЛА:
1. **УМНОЕ ОБНОВЛЕНИЕ**: Если пользователь уточняет, дополняет или изменяет существующую задачу - ОБНОВЛЯЙ её, а не создавай новую
2. **НОВЫЕ ЗАДАЧИ**: Создавай только для действительно новых планов/идей
3. **РАЗБИВКА**: Сложные задачи разбивай на подзадачи
4. **КРАТКОСТЬ**: Заголовок 2-3 слова, описание только при необходимости
5. **ДЕДЛАЙНЫ**: 
   - "До 30 ноября" = 30.11.2025 23:59 (включительно)
   - "До 30 ноября не включительно" = 29.11.2025 23:59 (исключительно)
   - Если время не указано = 00:00 (не отображается)
   - Анализируй контекст: включительно или исключительно
6. **ОБНОВЛЕНИЯ**: Обновляй только те поля, которые действительно изменились. Если заголовок тот же - НЕ указывай title

ПРИМЕРЫ УМНОГО ОБНОВЛЕНИЯ:
- "Кстати, к врачу нужно завтра в 10 утра" → обновить deadline: "2024-01-16T10:00:00+03:00"
- "Добавь к изучению программирования - еще нужно практиковаться" → обновить description
- "Перенеси тренировку на вечер" → обновить deadline
- "Хочу изучить Python вместо JavaScript" → обновить title
- "Купить машину до 30 ноября" → обновить только deadline: "2024-11-30T23:59:59+03:00" (title не меняется!)
- "Купить машину до 30 ноября не включительно" → обновить только deadline: "2024-11-29T23:59:59+03:00" (title не меняется!)

ПРИМЕРЫ НОВЫХ ЗАДАЧ:
- "Еще нужно купить продукты" → новая задача
- "А что с английским?" → новая задача
- "Хорошо бы начать читать" → новая задача

ПРИМЕРЫ ПРАВИЛЬНЫХ ДЕДЛАЙНОВ:
- "До завтра" → "2024-01-15T23:59:59+03:00" (сегодня 23:59)
- "До конца недели" → "2024-01-21T23:59:59+03:00" (воскресенье 23:59)
- "До конца месяца" → "2024-01-31T23:59:59+03:00" (конец месяца)
- "До 2026 года" → "2025-12-31T23:59:59+03:00" (31 декабря 2025)
- "1 ноября" → "2024-11-01T00:00:00+03:00" (начало дня, время не отображается)
- "Завтра в 10:00" → "2024-01-16T10:00:00+03:00" (конкретное время)

ФОРМАТ ОТВЕТА (только JSON):
{
  "newTasks": [
    {
      "title": "Краткий заголовок",
      "description": "Подробности (если нужны)",
      "assignedUserId": null,
      "assignedRoleId": null,
      "deadline": "YYYY-MM-DDTHH:mm:ss+03:00" | null
    }
  ],
  "updatedTasks": [
    {
      "id": number, // ТОЛЬКО ID из существующих задач
      "title": "новое название" | null,
      "description": "новое описание" | null,
      "assignedUserId": null,
      "assignedRoleId": null,
      "deadline": "YYYY-MM-DDTHH:mm:ss+03:00" | null
    }
  ]
}`;
  },

};