# Track-It Backend

Backend сервер для приложения управления задачами Track-It, интегрированного с Telegram.

## Структура проекта

```
back/
├── src/
│   ├── bot/              # Telegram бот
│   │   └── telegramBot.ts
│   ├── configs/          # Конфигурации
│   │   ├── database.ts   # Настройки БД
│   │   └── geminiPrompts.ts  # Промпты для AI
│   ├── entities/         # TypeORM сущности
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── Task.ts
│   │   ├── TaskComment.ts
│   │   ├── Label.ts
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   └── auth.ts       # JWT аутентификация
│   ├── routes/           # API routes
│   │   ├── auth.ts       # Аутентификация
│   │   ├── users.ts      # Управление пользователями
│   │   ├── chats.ts      # Управление чатами
│   │   ├── tasks.ts      # Управление задачами
│   │   ├── comments.ts   # Комментарии к задачам
│   │   ├── labels.ts     # Метки задач
│   │   ├── roles.ts      # Роли пользователей
│   │   ├── gemini.ts     # AI обработка задач
│   │   └── notifications.ts  # Настройки уведомлений
│   ├── services/         # Бизнес-логика
│   │   ├── userManager.ts        # Управление пользователями
│   │   ├── geminiService.ts      # Интеграция с Gemini AI
│   │   ├── messageProcessor.ts  # Обработка сообщений
│   │   ├── notificationService.ts    # Уведомления
│   │   ├── notificationScheduler.ts  # Планировщик уведомлений
│   │   ├── taskHistoryService.ts     # История изменений задач
│   │   └── task-service/         # Сервис задач
│   ├── types/            # TypeScript типы
│   ├── utils/            # Утилиты
│   │   ├── logger.ts     # Централизованный логгер
│   │   ├── audioUtils.ts # Обработка аудио
│   │   └── formatter.ts  # Форматирование
│   ├── scripts/          # Скрипты
│   │   └── sync-schema.ts
│   └── server.ts         # Точка входа
├── database/             # SQL схемы
│   └── schema/
└── package.json
```

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход через Telegram WebApp
- `GET /api/auth/verify` - Проверка токена

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/users/:id` - Получить пользователя
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

### Чаты
- `GET /api/chats` - Список чатов
- `GET /api/chats/:id` - Получить чат
- `POST /api/chats` - Создать чат
- `PUT /api/chats/:id` - Обновить чат
- `DELETE /api/chats/:id` - Удалить чат

### Задачи
- `GET /api/tasks` - Список задач
- `GET /api/tasks/:id` - Получить задачу
- `POST /api/tasks` - Создать задачу
- `PUT /api/tasks/:id` - Обновить задачу
- `PATCH /api/tasks/:id/status` - Изменить статус задачи
- `DELETE /api/tasks/:id` - Удалить задачу

### Комментарии
- `GET /api/comments/task/:taskId` - Комментарии к задаче
- `POST /api/comments` - Создать комментарий
- `PUT /api/comments/:id` - Обновить комментарий
- `DELETE /api/comments/:id` - Удалить комментарий

### Метки (Labels)
- `GET /api/labels/chat/:chatId` - Метки чата
- `POST /api/labels` - Создать метку
- `PUT /api/labels/:id` - Обновить метку
- `DELETE /api/labels/:id` - Удалить метку

### Роли
- `GET /api/roles` - Список ролей
- `GET /api/roles/:id` - Получить роль
- `POST /api/roles` - Создать роль
- `PUT /api/roles/:id` - Обновить роль
- `DELETE /api/roles/:id` - Удалить роль

### AI (Gemini)
- `POST /api/gemini/extract` - Извлечь задачи из текста/аудио

### Уведомления
- `GET /api/notifications` - Настройки уведомлений
- `PUT /api/notifications` - Обновить настройки

## Установка и запуск

```bash
# Установка зависимостей
pnpm install

# Настройка переменных окружения
cp .env.example .env
# Заполните .env файл

# Запуск в режиме разработки
pnpm dev

# Сборка
pnpm build

# Запуск production
pnpm start
```

## Переменные окружения

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=track_it

# JWT
JWT_SECRET=your-secret-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## База данных

Проект использует PostgreSQL с TypeORM. Схема базы данных находится в `database/schema/`.

Для синхронизации схемы:
```bash
pnpm typeorm schema:sync
```

## Тестирование

```bash
# Запуск тестов
pnpm test

# С покрытием
pnpm test:coverage
```

## Архитектура

### Сервисы

- **UserManager** - Управление пользователями и чатами
- **GeminiService** - Интеграция с Google Gemini AI для извлечения задач
- **MessageProcessor** - Обработка сообщений Telegram
- **TaskService** - Бизнес-логика работы с задачами
- **NotificationService** - Отправка уведомлений
- **NotificationScheduler** - Планировщик уведомлений (cron)
- **TaskHistoryService** - Логирование изменений задач

### Telegram Bot

Бот обрабатывает:
- Команды: `/users`, `/tasks`, `/check`
- Сообщения в личных чатах (автоматическая обработка)
- Сообщения в группах (только через `/check`)
- Новых участников группы
- Голосовые сообщения

### AI Интеграция

Используется Google Gemini 2.5 Flash для:
- Извлечения задач из текста
- Извлечения задач из аудио
- Умного обновления существующих задач
- Создания меток для задач

## Логирование

Используется централизованный логгер (`src/utils/logger.ts`):
- `logger.error()` - Ошибки
- `logger.warn()` - Предупреждения
- `logger.info()` - Информация
- `logger.debug()` - Отладочная информация

Уровень логирования настраивается через `LOG_LEVEL` в `.env`.

## Безопасность

- JWT токены для аутентификации
- Helmet для защиты заголовков
- CORS настройки
- Валидация входных данных
- Проверка прав доступа

## Лицензия

MIT
