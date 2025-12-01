# API Документация

## Базовый URL

```
http://localhost:3001/api
```

## Аутентификация

Большинство endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

Токен получается через `/api/auth/login` используя Telegram WebApp initData.

---

## Endpoints

### Аутентификация

#### POST /api/auth/login
Вход через Telegram WebApp.

**Request:**
```json
{
  "initData": "query_id=...&user=..."
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "telegramId": 123456,
    "username": "user",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### GET /api/auth/verify
Проверка токена.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

---

### Пользователи

#### GET /api/users
Список всех пользователей.

**Query params:**
- `chatId` (optional) - фильтр по чату

**Response:**
```json
[
  {
    "id": 1,
    "telegramId": 123456,
    "username": "user",
    "firstName": "John",
    "lastName": "Doe",
    "photoUrl": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/users/:id
Получить пользователя по ID.

#### PUT /api/users/:id
Обновить пользователя.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "photoUrl": "https://..."
}
```

#### DELETE /api/users/:id
Удалить пользователя.

---

### Чаты

#### GET /api/chats
Список чатов пользователя.

#### GET /api/chats/:id
Получить чат по ID.

#### POST /api/chats
Создать чат.

**Request:**
```json
{
  "id": -1234567890,
  "title": "My Chat",
  "messageId": 1
}
```

#### PUT /api/chats/:id
Обновить чат.

#### DELETE /api/chats/:id
Удалить чат.

---

### Задачи

#### GET /api/tasks
Список задач.

**Query params:**
- `chatId` (required) - ID чата
- `status` (optional) - фильтр по статусу: `backlog`, `in_progress`, `completed`
- `assignedUserId` (optional) - фильтр по назначенному пользователю

**Response:**
```json
[
  {
    "id": 1,
    "title": "Task Title",
    "description": "Task description",
    "status": "backlog",
    "assignedUserId": 1,
    "assignedRoleId": null,
    "deadline": "2024-12-31T23:59:59.000Z",
    "labelId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "assignedUser": { ... },
    "label": { ... }
  }
]
```

#### GET /api/tasks/:id
Получить задачу по ID.

#### POST /api/tasks
Создать задачу.

**Request:**
```json
{
  "title": "Task Title",
  "description": "Task description",
  "chatId": 1,
  "assignedUserId": 1,
  "assignedRoleId": null,
  "deadline": "2024-12-31T23:59:59.000Z",
  "labelId": 1,
  "status": "backlog"
}
```

#### PUT /api/tasks/:id
Обновить задачу.

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "assignedUserId": 2,
  "deadline": "2024-12-31T23:59:59.000Z",
  "labelId": 2
}
```

#### PATCH /api/tasks/:id/status
Изменить статус задачи.

**Request:**
```json
{
  "status": "in_progress",
  "assignedUserId": 1
}
```

#### DELETE /api/tasks/:id
Удалить задачу.

---

### Комментарии

#### GET /api/comments/task/:taskId
Получить все комментарии к задаче.

**Response:**
```json
[
  {
    "id": 1,
    "taskId": 1,
    "userId": 1,
    "content": "Comment text",
    "edited": false,
    "editedAt": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": { ... }
  }
]
```

#### POST /api/comments
Создать комментарий.

**Request:**
```json
{
  "taskId": 1,
  "content": "Comment text"
}
```

#### PUT /api/comments/:id
Обновить комментарий (только свои).

**Request:**
```json
{
  "content": "Updated comment text"
}
```

#### DELETE /api/comments/:id
Удалить комментарий (только свои).

---

### Метки (Labels)

#### GET /api/labels/chat/:chatId
Получить все метки чата.

**Response:**
```json
[
  {
    "id": 1,
    "chatId": 1,
    "name": "frontend",
    "color": "#3B82F6",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/labels
Создать метку.

**Request:**
```json
{
  "chatId": 1,
  "name": "frontend",
  "color": "#3B82F6"
}
```

#### PUT /api/labels/:id
Обновить метку.

**Request:**
```json
{
  "name": "backend",
  "color": "#10B981"
}
```

#### DELETE /api/labels/:id
Удалить метку (автоматически убирает метку у всех задач).

---

### Роли

#### GET /api/roles
Список всех ролей.

#### GET /api/roles/:id
Получить роль по ID.

#### POST /api/roles
Создать роль.

**Request:**
```json
{
  "title": "Developer"
}
```

#### PUT /api/roles/:id
Обновить роль.

#### DELETE /api/roles/:id
Удалить роль.

---

### AI (Gemini)

#### POST /api/gemini/extract
Извлечь задачи из текста или аудио.

**Request (multipart/form-data):**
- `text` (string) - текст сообщения
- `chatId` (number) - ID чата
- `audioData` (file, optional) - аудио файл

**Response:**
```json
{
  "newTasks": [
    {
      "title": "Task Title",
      "description": "Task description",
      "assignedUserId": 1,
      "deadline": "2024-12-31T23:59:59.000Z",
      "labelId": 1
    }
  ],
  "updatedTasks": [
    {
      "id": 1,
      "title": "Updated Title"
    }
  ],
  "newLabels": [
    {
      "name": "frontend",
      "color": "#3B82F6"
    }
  ]
}
```

---

### Уведомления

#### GET /api/notifications
Получить настройки уведомлений текущего пользователя.

**Response:**
```json
{
  "dailyDigestTime": "09:00",
  "deadlineReminderHours": [24, 12, 1]
}
```

#### PUT /api/notifications
Обновить настройки уведомлений.

**Request:**
```json
{
  "dailyDigestTime": "09:00",
  "deadlineReminderHours": [24, 12, 1]
}
```

**Валидация:**
- `dailyDigestTime` - формат `HH:mm` (00:00 - 23:59)
- `deadlineReminderHours` - массив положительных чисел

---

## Коды ошибок

- `400` - Неверный запрос (валидация)
- `401` - Не авторизован (нет токена)
- `403` - Доступ запрещен (неверный токен)
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Примеры использования

### Создание задачи с меткой

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Создать API",
    "description": "Создать REST API для задач",
    "chatId": 1,
    "labelId": 1,
    "status": "backlog"
  }'
```

### Добавление комментария

```bash
curl -X POST http://localhost:3001/api/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": 1,
    "content": "Начал работу над задачей"
  }'
```

### Изменение статуса задачи

```bash
curl -X PATCH http://localhost:3001/api/tasks/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assignedUserId": 1
  }'
```

