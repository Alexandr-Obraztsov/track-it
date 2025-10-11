# Track-It Backend

Backend API для приложения Track-It, построенный на Express.js и TypeORM.

## Структура базы данных

### Сущности

#### User
- `id` - Primary Key (bigint)
- `username` - string
- `firstName` - string  
- `secondName` - string (nullable)
- `createdAt` - timestamp

#### Chat
- `id` - Primary Key (bigint)
- `title` - string
- `createdAt` - timestamp
- `messageId` - int

#### Role
- `id` - Primary Key (bigint)
- `title` - string
- `createdAt` - timestamp

### Связи

- **User ↔ Chat ↔ Role**: Тройная связь через таблицу `user_chat_roles`
- **Chat ↔ Role**: Связь через таблицу `chat_roles` (доступные роли в чате)

## 🐳 Запуск с Docker

### Быстрый старт

1. Перейдите в папку `back`

2. Запустите все сервисы:
```bash
docker-compose up -d
```

3. API будет доступно на `http://localhost:3001`
4. PostgreSQL будет доступен на `localhost:5432`

### Управление контейнерами

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes (ОСТОРОЖНО: удалит данные БД)
docker-compose down -v

# Пересобрать образы
docker-compose build --no-cache

# Просмотр логов
docker-compose logs -f

# Статус контейнеров
docker-compose ps
```

## 🛠️ Локальная разработка

1. Установите зависимости:
```bash
pnpm install
```

2. Настройте переменные окружения:
```bash
cp env.docker .env
```

3. Запустите PostgreSQL локально или используйте Docker:
```bash
docker-compose up postgres -d
```

4. Запустите в режиме разработки:
```bash
pnpm dev
```

## API Endpoints

### Users
- `GET /api/users` - получить всех пользователей
- `GET /api/users/:id` - получить пользователя по ID
- `POST /api/users` - создать пользователя
- `PUT /api/users/:id` - обновить пользователя
- `DELETE /api/users/:id` - удалить пользователя

### Chats
- `GET /api/chats` - получить все чаты
- `GET /api/chats/:id` - получить чат по ID
- `POST /api/chats` - создать чат
- `PUT /api/chats/:id` - обновить чат
- `DELETE /api/chats/:id` - удалить чат

### Roles
- `GET /api/roles` - получить все роли
- `GET /api/roles/:id` - получить роль по ID
- `POST /api/roles` - создать роль
- `PUT /api/roles/:id` - обновить роль
- `DELETE /api/roles/:id` - удалить роль

### Health Check
- `GET /health` - проверка состояния сервера

## Технологии

- **Node.js** + **Express.js**
- **TypeScript**
- **TypeORM** (ORM)
- **PostgreSQL** (база данных)
- **CORS**, **Helmet**, **Morgan** (middleware)
