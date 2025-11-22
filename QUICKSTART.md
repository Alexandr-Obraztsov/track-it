# Quick Start Guide

## Backend

1. Установите зависимости:
```bash
cd back
pnpm install
```

2. Настройте переменные окружения:
```bash
# Файл .env уже создан с тестовым токеном бота
# Убедитесь, что все необходимые переменные настроены:
# - TELEGRAM_BOT_TOKEN (уже добавлен)
# - JWT_SECRET (сгенерируйте свой секретный ключ)
# - DB_* (настройки базы данных)
# - GEMINI_API_KEY (если используете Gemini AI)
```

3. Запустите базу данных (если используете Docker):
```bash
docker-compose up -d
```

4. Запустите бекенд:
```bash
pnpm dev
```

Бекенд будет доступен на `http://localhost:3001`

## Frontend

1. Установите зависимости:
```bash
cd front
pnpm install
```

2. Настройте переменные окружения (создайте `.env`):
```bash
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

3. Запустите фронтенд:
```bash
pnpm dev
```

Фронтенд будет доступен на `http://localhost:5173`

## Авторизация

Приложение использует авторизацию через Telegram WebApp:
- В продакшене: используется `initData` из Telegram WebApp SDK
- В режиме разработки: используется мок-данные для тестирования

## API Endpoints

- `POST /api/auth/telegram` - Авторизация через Telegram WebApp
- `GET /api/auth/profile` - Получение профиля пользователя (требует JWT токен)

Все остальные эндпоинты требуют JWT токен в заголовке `Authorization: Bearer <token>`

