# INSTRUCTION - Track-It Project

## Обзор проекта

**Track-It** - это система управления задачами с интеграцией Telegram бота и AI-анализа. Проект позволяет создавать задачи из текстовых и голосовых сообщений через Telegram, автоматически извлекать задачи с помощью Google Gemini AI, и управлять ими через веб-интерфейс.

### Технологический стек

**Backend:**
- Node.js + Express.js
- TypeScript
- TypeORM (ORM)
- PostgreSQL (база данных)
- node-telegram-bot-api (Telegram Bot)
- @google/generative-ai (Gemini AI)
- JWT (авторизация)
- crypto-js (проверка подписи Telegram)

**Frontend:**
- React 19
- TypeScript
- Vite (сборщик)
- Redux Toolkit + RTK Query (управление состоянием)
- React Router v7 (маршрутизация)
- TailwindCSS 4 (стилизация)
- shadcn/ui (UI компоненты)
- Framer Motion (анимации)
- @twa-dev/sdk (Telegram WebApp SDK)

## Структура проекта

```
track-it/
├── back/                    # Backend приложение
│   ├── src/
│   │   ├── bot/            # Telegram бот
│   │   ├── configs/        # Конфигурации (БД, промпты)
│   │   ├── entities/       # TypeORM сущности
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API маршруты
│   │   ├── services/       # Бизнес-логика
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Утилиты
│   │   └── server.ts       # Точка входа
│   ├── dist/               # Скомпилированный код
│   ├── docker-compose.yml  # Docker конфигурация
│   └── package.json
│
└── front/                   # Frontend приложение
    ├── src/
    │   ├── components/     # React компоненты
    │   ├── pages/          # Страницы приложения
    │   ├── store/          # Redux store
    │   ├── router/         # Маршрутизация
    │   ├── hooks/          # React хуки
    │   ├── lib/            # Утилиты
    │   └── types/          # TypeScript типы
    └── package.json
```

## Архитектура базы данных

### Основные сущности

#### User (Пользователь)
- `id` (bigint, PK, auto-increment)
- `telegramId` (bigint, unique) - ID пользователя в Telegram
- `username` (varchar, nullable)
- `firstName` (varchar)
- `lastName` (varchar, nullable)
- `photoUrl` (varchar, nullable)
- `createdAt` (timestamp)

**Связи:**
- Один-ко-многим с `UserChatRole` (роли пользователя в чатах)
- Один-ко-многим с `UserTask` (личные задачи пользователя)

#### Chat (Чат)
- `id` (bigint, PK) - ID чата в Telegram
- `title` (varchar) - Название чата
- `messageId` (int) - ID сообщения
- `createdAt` (timestamp)

**Связи:**
- Один-ко-многим с `UserChatRole` (пользователи с ролями в чате)
- Один-ко-многим с `ChatRole` (доступные роли в чате)
- Один-ко-многим с `Task` (задачи чата)
- Один-ко-многим с `ChatTask` (промежуточная таблица)

#### Task (Задача)
- `id` (bigint, PK, auto-increment)
- `title` (varchar) - Заголовок задачи
- `description` (text, nullable) - Описание
- `assignedUserId` (int, nullable) - Назначенный пользователь
- `assignedRoleId` (int, nullable) - Назначенная роль
- `deadline` (date, nullable) - Дедлайн
- `status` (enum: 'backlog' | 'in_progress' | 'completed') - Статус
- `createdAt` (timestamp)

**Связи:**
- Многие-к-одному с `Chat` (для групповых задач)
- Многие-к-одному с `User` (назначенный пользователь)
- Многие-к-одному с `Role` (назначенная роль)
- Один-ко-многим с `UserTask` (личные задачи)
- Один-ко-многим с `ChatTask` (групповые задачи)

#### Role (Роль)
- `id` (bigint, PK, auto-increment)
- `title` (varchar) - Название роли
- `createdAt` (timestamp)

**Связи:**
- Один-ко-многим с `UserChatRole` (назначенные роли)
- Один-ко-многим с `ChatRole` (роли в чатах)
- Один-ко-многим с `Task` (назначенные задачи)

### Промежуточные таблицы

#### UserChatRole
Связывает пользователя, чат и роль (многие-ко-многим).
- `id` (PK)
- `userId` (FK → User)
- `chatId` (FK → Chat)
- `roleId` (FK → Role)
- `createdAt`

#### ChatRole
Связывает чат и доступные в нем роли.
- `id` (PK)
- `chatId` (FK → Chat)
- `roleId` (FK → Role)
- `createdAt`

#### UserTask
Связывает пользователя и личную задачу.
- `id` (PK)
- `userId` (FK → User)
- `taskId` (FK → Task)
- `createdAt`

#### ChatTask
Связывает чат и групповую задачу.
- `id` (PK)
- `chatId` (FK → Chat)
- `taskId` (FK → Task)
- `createdAt`

## Backend архитектура

### Основные компоненты

#### 1. Telegram Bot (`bot/telegramBot.ts`)

**Класс:** `TelegramBotService`

**Функциональность:**
- Обработка входящих сообщений из Telegram
- Команды бота:
  - `/tasks` - показать список задач
  - `/check` - обработать reply-сообщение в группе
  - `/users` - показать участников группы
- Автоматическая обработка сообщений в личных чатах
- Обработка новых участников группы
- Поддержка текстовых и голосовых сообщений

**Логика обработки:**
- **Личные чаты:** все сообщения обрабатываются автоматически
- **Групповые чаты:** только через команду `/check` (reply на сообщение)
- Системные сообщения игнорируются
- Сообщения от ботов игнорируются

#### 2. Message Processor (`services/messageProcessor.ts`)

**Класс:** `MessageProcessor`

**Функциональность:**
- Извлечение контента из сообщений (текст/голос)
- Обработка через Gemini AI для извлечения задач
- Сохранение задач в БД
- Форматирование ответных сообщений

**Методы:**
- `processMessage()` - основной метод обработки
- `handleTasksCommand()` - обработка команды /tasks
- `extractMessageContent()` - извлечение контента
- `formatResponseMessage()` - форматирование ответа
- `formatTasksList()` - форматирование списка задач

#### 3. Gemini Service (`services/geminiService.ts`)

**Класс:** `GeminiService`

**Функциональность:**
- Интеграция с Google Gemini AI
- Извлечение задач из текста/аудио
- Использование модели `gemini-2.5-flash`

**Методы:**
- `extractTasks()` - извлечение задач с помощью AI

**Промпты:**
- Разные промпты для личных и групповых задач
- Умное обновление существующих задач
- Извлечение дедлайнов, назначений, описаний

#### 4. Task Service (`services/task-service/task-service.ts`)

**Класс:** `TaskService`

**Функциональность:**
- Сохранение задач в БД
- Создание новых задач
- Обновление существующих задач
- Получение задач (личных/групповых)

**Методы:**
- `saveTasks()` - сохранение задач из Gemini результата
- `getUserPersonalTasks()` - личные задачи пользователя
- `getChatTasks()` - задачи чата
- `getTaskById()` - задача по ID
- `deleteTask()` - удаление задачи

#### 5. User Manager (`services/userManager.ts`)

**Класс:** `UserManager`

**Функциональность:**
- Управление пользователями
- Управление чатами
- Управление ролями
- Связи пользователь-чат-роль

**Методы:**
- `getOrCreateUser()` - получение/создание пользователя
- `getOrCreateChat()` - получение/создание чата
- `getUserById()` - пользователь по ID
- `getChatById()` - чат по ID
- `getChatUsers()` - пользователи чата
- `addUserToChat()` - добавление пользователя в чат
- `removeUserFromChat()` - удаление пользователя из чата
- `getUserChatRoles()` - роли пользователя в чате
- `getChatRoles()` - доступные роли в чате
- `addRoleToChat()` - добавление роли в чат

### API Endpoints

#### Auth (`/api/auth`)

##### `POST /api/auth/telegram`
**Описание:** Авторизация через Telegram WebApp

**Аутентификация:** Не требуется

**Request Body:**
```json
{
  "id": number,                    // Telegram user ID
  "first_name": string,            // Имя пользователя
  "last_name": string | null,      // Фамилия (опционально)
  "username": string | null,       // Username (опционально)
  "photo_url": string | null,      // URL фото (опционально)
  "auth_date": number,             // Unix timestamp авторизации
  "hash": string                   // Подпись для проверки
}
```

**Response 200:**
```json
{
  "user": {
    "id": number,                 // Telegram user ID
    "first_name": string,
    "last_name": string | null,
    "username": string | null,
    "photo_url": string | null,
    "auth_date": number,
    "hash": string
  },
  "token": string                  // JWT токен (expires in 30 days)
}
```

**Response 401:** `{ "error": string }` - Неверная подпись или устаревшие данные

**Response 500:** `{ "error": "Internal server error" }`

---

##### `GET /api/auth/profile`
**Описание:** Получение профиля текущего пользователя

**Аутентификация:** Требуется (JWT токен в заголовке `Authorization: Bearer <token>`)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
{
  "id": number,                   // Telegram user ID
  "first_name": string,
  "last_name": string | null,
  "username": string | null,
  "photo_url": string | null
}
```

**Response 401:** `{ "error": "Access token required" }`

**Response 403:** `{ "error": "Invalid token" }`

**Response 404:** `{ "error": "User not found" }`

**Response 500:** `{ "error": "Internal server error" }`

---

#### Tasks (`/api/tasks`)

##### `GET /api/tasks/personal`
**Описание:** Получение личных задач текущего пользователя

**Аутентификация:** Требуется (JWT токен)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
[
  {
    "id": number,
    "title": string,
    "description": string | null,
    "assignedUserId": number | null,
    "assignedRoleId": number | null,
    "deadline": string | null,      // ISO date string
    "status": "backlog" | "in_progress" | "completed",
    "createdAt": string,            // ISO timestamp
    "assignedUser": User | null,
    "assignedRole": Role | null
  }
]
```

**Response 401:** `{ "error": "Access token required" }`

**Response 500:** `{ "error": "Failed to fetch tasks" }`

---

##### `GET /api/tasks/chat/:chatId`
**Описание:** Получение задач чата

**Аутентификация:** Не требуется

**Path Parameters:**
- `chatId` (number) - ID чата

**Response 200:**
```json
[
  {
    "id": number,
    "title": string,
    "description": string | null,
    "assignedUserId": number | null,
    "assignedRoleId": number | null,
    "deadline": string | null,
    "status": "backlog" | "in_progress" | "completed",
    "createdAt": string,
    "assignedUser": User | null,
    "assignedRole": Role | null
  }
]
```

**Response 500:** `{ "error": "Failed to fetch tasks" }`

---

##### `GET /api/tasks/:id`
**Описание:** Получение задачи по ID

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID задачи

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "description": string | null,
  "assignedUserId": number | null,
  "assignedRoleId": number | null,
  "deadline": string | null,
  "status": "backlog" | "in_progress" | "completed",
  "createdAt": string,
  "assignedUser": User | null,
  "assignedRole": Role | null
}
```

**Response 400:** `{ "error": "Invalid ID" }`

**Response 404:** `{ "error": "Task not found" }`

**Response 500:** `{ "error": "Failed to fetch task" }`

---

##### `PATCH /api/tasks/:id/status`
**Описание:** Изменение статуса задачи

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID задачи

**Request Body:**
```json
{
  "status": "backlog" | "in_progress" | "completed"
}
```

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "description": string | null,
  "assignedUserId": number | null,
  "assignedRoleId": number | null,
  "deadline": string | null,
  "status": "backlog" | "in_progress" | "completed",
  "createdAt": string,
  "assignedUser": User | null,
  "assignedRole": Role | null
}
```

**Response 400:** `{ "error": "Invalid ID" }` или `{ "error": "Invalid status" }`

**Response 404:** `{ "error": "Task not found" }`

**Response 500:** `{ "error": "Failed to update status" }`

---

##### `DELETE /api/tasks/:id`
**Описание:** Удаление задачи

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID задачи

**Response 204:** No content (успешное удаление)

**Response 400:** `{ "error": "Invalid ID" }`

**Response 404:** `{ "error": "Task not found" }`

**Response 500:** `{ "error": "Failed to delete task" }`

---

#### Users (`/api/users`)

##### `GET /api/users`
**Описание:** Получение всех пользователей

**Аутентификация:** Не требуется

**Response 200:**
```json
[
  {
    "id": number,
    "telegramId": number,
    "username": string | null,
    "firstName": string,
    "lastName": string | null,
    "photoUrl": string | null,
    "createdAt": string,
    "userChatRoles": UserChatRole[],
    "userTasks": UserTask[]
  }
]
```

**Response 500:** `{ "error": "Failed to fetch users" }`

---

##### `GET /api/users/:id`
**Описание:** Получение пользователя по ID

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID пользователя

**Response 200:**
```json
{
  "id": number,
  "telegramId": number,
  "username": string | null,
  "firstName": string,
  "lastName": string | null,
  "photoUrl": string | null,
  "createdAt": string,
  "userChatRoles": UserChatRole[],
  "userTasks": UserTask[]
}
```

**Response 404:** `{ "error": "User not found" }`

**Response 500:** `{ "error": "Failed to fetch user" }`

---

##### `POST /api/users`
**Описание:** Создание нового пользователя

**Аутентификация:** Не требуется

**Request Body:**
```json
{
  "username": string,              // Обязательно
  "firstName": string,              // Обязательно
  "lastName": string | null        // Опционально
}
```

**Response 201:**
```json
{
  "id": number,
  "telegramId": number | null,
  "username": string,
  "firstName": string,
  "lastName": string | null,
  "photoUrl": string | null,
  "createdAt": string
}
```

**Response 400:** `{ "error": "Username and firstName are required" }`

**Response 500:** `{ "error": "Failed to create user" }`

---

##### `PUT /api/users/:id`
**Описание:** Обновление пользователя

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID пользователя

**Request Body:**
```json
{
  "username": string | null,        // Опционально
  "firstName": string | null,       // Опционально
  "lastName": string | null         // Опционально
}
```

**Response 200:**
```json
{
  "id": number,
  "telegramId": number,
  "username": string,
  "firstName": string,
  "lastName": string | null,
  "photoUrl": string | null,
  "createdAt": string
}
```

**Response 404:** `{ "error": "User not found" }`

**Response 500:** `{ "error": "Failed to update user" }`

---

##### `DELETE /api/users/:id`
**Описание:** Удаление пользователя

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID пользователя

**Response 204:** No content (успешное удаление)

**Response 404:** `{ "error": "User not found" }`

**Response 500:** `{ "error": "Failed to delete user" }`

---

#### Chats (`/api/chats`)

##### `GET /api/chats`
**Описание:** Получение всех чатов

**Аутентификация:** Требуется (JWT токен)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response 200:**
```json
[
  {
    "id": number,                  // Telegram chat ID (bigint)
    "title": string,
    "messageId": number,
    "createdAt": string,
    "userChatRoles": UserChatRole[],
    "chatRoles": ChatRole[],
    "tasks": Task[]
  }
]
```

**Response 401:** `{ "error": "Access token required" }`

**Response 500:** `{ "error": "Failed to fetch chats" }`

---

##### `GET /api/chats/:id`
**Описание:** Получение чата по ID

**Аутентификация:** Требуется (JWT токен)

**Path Parameters:**
- `id` (number) - ID чата (Telegram chat ID)

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "messageId": number,
  "createdAt": string,
  "userChatRoles": UserChatRole[],
  "chatRoles": ChatRole[],
  "tasks": Task[]
}
```

**Response 401:** `{ "error": "Access token required" }`

**Response 404:** `{ "error": "Chat not found" }`

**Response 500:** `{ "error": "Failed to fetch chat" }`

---

##### `POST /api/chats`
**Описание:** Создание нового чата

**Аутентификация:** Требуется (JWT токен)

**Request Body:**
```json
{
  "title": string,                // Обязательно
  "messageId": number             // Обязательно
}
```

**Response 201:**
```json
{
  "id": number,
  "title": string,
  "messageId": number,
  "createdAt": string
}
```

**Response 400:** `{ "error": "Title and messageId are required" }`

**Response 401:** `{ "error": "Access token required" }`

**Response 500:** `{ "error": "Failed to create chat" }`

---

##### `PUT /api/chats/:id`
**Описание:** Обновление чата

**Аутентификация:** Требуется (JWT токен)

**Path Parameters:**
- `id` (number) - ID чата

**Request Body:**
```json
{
  "title": string | null,         // Опционально
  "messageId": number | null       // Опционально
}
```

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "messageId": number,
  "createdAt": string
}
```

**Response 401:** `{ "error": "Access token required" }`

**Response 404:** `{ "error": "Chat not found" }`

**Response 500:** `{ "error": "Failed to update chat" }`

---

##### `DELETE /api/chats/:id`
**Описание:** Удаление чата

**Аутентификация:** Требуется (JWT токен)

**Path Parameters:**
- `id` (number) - ID чата

**Response 204:** No content (успешное удаление)

**Response 401:** `{ "error": "Access token required" }`

**Response 404:** `{ "error": "Chat not found" }`

**Response 500:** `{ "error": "Failed to delete chat" }`

---

#### Roles (`/api/roles`)

##### `GET /api/roles`
**Описание:** Получение всех ролей

**Аутентификация:** Не требуется

**Response 200:**
```json
[
  {
    "id": number,
    "title": string,
    "createdAt": string,
    "userChatRoles": UserChatRole[],
    "chatRoles": ChatRole[],
    "assignedTasks": Task[]
  }
]
```

**Response 500:** `{ "error": "Failed to fetch roles" }`

---

##### `GET /api/roles/:id`
**Описание:** Получение роли по ID

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID роли

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "createdAt": string,
  "userChatRoles": UserChatRole[],
  "chatRoles": ChatRole[],
  "assignedTasks": Task[]
}
```

**Response 404:** `{ "error": "Role not found" }`

**Response 500:** `{ "error": "Failed to fetch role" }`

---

##### `POST /api/roles`
**Описание:** Создание новой роли

**Аутентификация:** Не требуется

**Request Body:**
```json
{
  "title": string                 // Обязательно
}
```

**Response 201:**
```json
{
  "id": number,
  "title": string,
  "createdAt": string
}
```

**Response 400:** `{ "error": "Title is required" }`

**Response 500:** `{ "error": "Failed to create role" }`

---

##### `PUT /api/roles/:id`
**Описание:** Обновление роли

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID роли

**Request Body:**
```json
{
  "title": string | null          // Опционально
}
```

**Response 200:**
```json
{
  "id": number,
  "title": string,
  "createdAt": string
}
```

**Response 404:** `{ "error": "Role not found" }`

**Response 500:** `{ "error": "Failed to update role" }`

---

##### `DELETE /api/roles/:id`
**Описание:** Удаление роли

**Аутентификация:** Не требуется

**Path Parameters:**
- `id` (number) - ID роли

**Response 204:** No content (успешное удаление)

**Response 404:** `{ "error": "Role not found" }`

**Response 500:** `{ "error": "Failed to delete role" }`

---

#### Gemini (`/api/gemini`)

##### `POST /api/gemini/extract`
**Описание:** Извлечение задач из текста или аудио через Gemini AI

**Аутентификация:** Требуется (JWT токен)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `text` (string, optional) - Текстовое сообщение
- `type` (string, required) - Тип: `"personal"` или `"group"`
- `chatId` (number, optional) - ID чата (обязательно для `type="group"`)
- `audioData` (File, optional) - Аудио файл (макс. 20MB)

**Примечания:**
- Должен быть передан либо `text`, либо `audioData` (или оба)
- Для `type="group"` обязательно указать `chatId`
- Для `type="personal"` используется `userId` из JWT токена
- Поддерживаемые аудио форматы: WAV, MP3, AIFF, AAC, OGG, FLAC, WebM

**Response 200:**
```json
{
  "newTasks": [
    {
      "title": string,
      "description": string | null,
      "assignedUserId": number | null,
      "assignedRoleId": number | null,
      "deadline": string | null      // ISO datetime string
    }
  ],
  "updatedTasks": [
    {
      "id": number,                  // ID существующей задачи
      "title": string | null,        // Только если изменилось
      "description": string | null,   // Только если изменилось
      "assignedUserId": number | null,
      "assignedRoleId": number | null,
      "deadline": string | null
    }
  ]
}
```

**Response 400:** 
```json
{
  "error": "Invalid parameters. For group tasks: type=group, chatId required. For personal tasks: type=personal, userId required."
}
```

**Response 401:** `{ "error": "Access token required" }`

**Response 404:** `{ "error": "Chat not found" }` или `{ "error": "User not found" }`

**Response 500:** `{ "error": "Failed to extract tasks" }`

**Примечание:** Задачи автоматически сохраняются в базу данных после извлечения.

### Middleware

#### Auth Middleware (`middleware/auth.ts`)
- `authenticateToken` - проверка JWT токена
- Извлекает `userId` из токена и добавляет в `req.user`

### Конфигурация

#### Database (`configs/database.ts`)
- TypeORM DataSource
- PostgreSQL подключение
- Автоматическая синхронизация в dev режиме

#### Gemini Prompts (`configs/geminiPrompts.ts`)
- Промпты для извлечения личных задач
- Промпты для извлечения групповых задач
- Правила обработки дедлайнов, назначений, обновлений

### Переменные окружения

Файл: `back/env.example`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=track_it

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

## Frontend архитектура

### Структура

#### Pages (`pages/`)
- `LoginPage.tsx` - страница авторизации
- `TasksPage.tsx` - список задач
- `TaskEditPage.tsx` - редактирование задачи
- `ChatsPage.tsx` - список чатов
- `ProfilePage.tsx` - профиль пользователя

#### Components (`components/`)
- `Layout.tsx` - основной layout с навигацией
- `TaskCard.tsx` - карточка задачи
- `TaskActionButtons.tsx` - кнопки действий (создание задачи)
- `TextTaskButton.tsx` - кнопка создания текстовой задачи
- `VoiceRecordButton.tsx` - кнопка записи голоса
- `ui/` - shadcn/ui компоненты

#### Store (`store/`)
- `index.ts` - Redux store
- `api/` - RTK Query API endpoints
  - `baseApi.ts` - базовый API клиент
  - `tasksApi.ts` - API для задач
  - `authApi.ts` - API для авторизации
  - и др.
- `slices/` - Redux slices

#### Router (`router/index.tsx`)
- React Router v7
- Защищенные маршруты
- Редирект с `/` на `/tasks`

### API Integration

#### RTK Query Endpoints

**Tasks API (`store/api/tasksApi.ts`):**
- `getTasks` - все задачи
- `getTaskById` - задача по ID
- `getPersonalTasks` - личные задачи
- `getChatTasks` - задачи чата
- `createTask` - создание задачи
- `updateTask` - обновление задачи
- `updateTaskStatus` - изменение статуса
- `deleteTask` - удаление задачи

**Auth API (`store/api/authApi.ts`):**
- `telegramAuth` - авторизация через Telegram
- `getProfile` - получение профиля

### UI Components

Используется библиотека **shadcn/ui** с кастомизацией через TailwindCSS.

Основные компоненты:
- Button, Card, Dialog, Alert
- Tabs, Select, Checkbox
- Avatar, Separator
- Empty states

### Стилизация

- **TailwindCSS 4** - utility-first CSS
- **Framer Motion** - анимации
- **Lucide React** - иконки
- Адаптивный дизайн
- Поддержка темной/светлой темы (автоматическое переключение)

## Потоки данных

### Создание задачи через Telegram

1. Пользователь отправляет сообщение в Telegram (текст/голос)
2. `TelegramBotService` получает сообщение
3. `MessageProcessor.processMessage()` обрабатывает сообщение
4. Извлечение контента (текст или конвертация голоса)
5. `GeminiService.extractTasks()` анализирует контент
6. Gemini возвращает JSON с новыми/обновленными задачами
7. `TaskService.saveTasks()` сохраняет задачи в БД
8. Формируется ответное сообщение для пользователя

### Создание задачи через Web

1. Пользователь создает задачу в веб-интерфейсе
2. Frontend отправляет запрос через RTK Query
3. Backend API endpoint обрабатывает запрос
4. Задача сохраняется в БД
5. RTK Query автоматически обновляет кеш

### Авторизация

1. Пользователь открывает приложение в Telegram WebApp
2. Telegram передает данные авторизации
3. Frontend отправляет `POST /api/auth/telegram`
4. Backend проверяет подпись Telegram (в production)
5. Создается/обновляется пользователь в БД
6. Генерируется JWT токен
7. Токен сохраняется в localStorage
8. Все последующие запросы включают токен в заголовке

## Особенности реализации

### Умное обновление задач

Gemini AI анализирует контекст и определяет:
- Новая задача или обновление существующей
- Какие поля нужно обновить
- Правильное извлечение дедлайнов

### Обработка дедлайнов

- "До 30 ноября" → 30.11.2025 23:59 (включительно)
- "До 30 ноября не включительно" → 29.11.2025 23:59
- "Завтра в 10:00" → конкретное время
- "1 ноября" → начало дня (00:00)

### Разделение личных и групповых задач

- **Личные задачи:** связываются через `UserTask`, автоматически назначаются на пользователя
- **Групповые задачи:** связываются через `ChatTask`, могут назначаться на пользователей или роли

### Статусы задач

- `backlog` - в очереди
- `in_progress` - в работе
- `completed` - выполнено

## Запуск проекта

### Backend

```bash
cd back
pnpm install
cp env.example .env
# Заполнить .env файл
pnpm dev
```

### Frontend

```bash
cd front
pnpm install
pnpm dev
```

### Docker

```bash
cd back
docker-compose up -d
```

## Важные замечания для разработки

1. **TypeORM синхронизация:** В dev режиме включена автоматическая синхронизация схемы БД. В production нужно использовать миграции.

2. **Telegram WebApp:** В режиме разработки проверка подписи Telegram отключена. В production обязательно включить.

3. **CORS:** Настроен для `http://localhost:5173`. Для production нужно обновить `CORS_ORIGIN`.

4. **JWT Secret:** Использовать надежный секретный ключ в production.

5. **Gemini API:** Требуется API ключ от Google. Модель: `gemini-2.5-flash`.

6. **База данных:** PostgreSQL обязательна. Можно использовать Docker или локальную установку.

7. **Telegram Bot Token:** Получить у @BotFather в Telegram.

## Типичные задачи для агента

### Добавление нового API endpoint

1. Создать/обновить route в `back/src/routes/`
2. Добавить обработчик с использованием TypeORM репозиториев
3. При необходимости добавить middleware (auth, validation)
4. Обновить типы в `back/src/types/` если нужно
5. Добавить endpoint в RTK Query на frontend
6. Использовать в компонентах

### Добавление новой сущности

1. Создать entity в `back/src/entities/`
2. Добавить в `database.ts` entities array
3. Создать репозиторий и сервис
4. Создать routes для CRUD операций
5. Добавить типы на frontend
6. Создать RTK Query endpoints
7. Создать UI компоненты

### Изменение логики обработки сообщений

1. Обновить промпты в `configs/geminiPrompts.ts`
2. При необходимости изменить `MessageProcessor`
3. Обновить `TaskService` если изменилась структура данных
4. Протестировать через Telegram бота

### Добавление новой команды бота

1. Добавить обработчик в `TelegramBotService.setupHandlers()`
2. Использовать `bot.onText()` для текстовых команд
3. Обработать через соответствующий сервис
4. Отправить ответ через `sendMessage()`

## Полезные команды

```bash
# Backend
cd back
pnpm dev              # Запуск в dev режиме
pnpm build            # Сборка
pnpm start            # Запуск production

# Frontend
cd front
pnpm dev              # Запуск dev сервера
pnpm build            # Сборка для production
pnpm preview           # Предпросмотр production сборки

# Docker
cd back
docker-compose up -d   # Запуск контейнеров
docker-compose down    # Остановка
docker-compose logs -f # Просмотр логов
```

## Контакты и документация

- Backend README: `back/README.md`
- Frontend README: `front/README.md`
- Основной README: `README.md`

---

**Последнее обновление:** 2024
**Версия проекта:** 1.0.0


