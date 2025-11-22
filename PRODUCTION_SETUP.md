# Настройка для продакшена (Telegram Mini App)

## Проблема "Network Error" в Telegram Mini App

Если вы получаете ошибку "Network Error" при заходе через Telegram Mini App, проверьте следующие настройки:

## 1. Настройка CORS на бекенде

В файле `.env` бекенда укажите все разрешенные домены:

```env
CORS_ORIGIN=https://yourdomain.com,https://web.telegram.org
```

Или для разработки:
```env
CORS_ORIGIN=http://localhost:5173,https://web.telegram.org
```

## 2. Настройка API URL на фронтенде

В файле `.env` фронтенда укажите URL вашего бекенда:

```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Важно:** 
- Используйте HTTPS для продакшена (Telegram Mini App требует HTTPS)
- URL должен быть доступен из интернета
- Убедитесь, что бекенд слушает на `0.0.0.0`, а не только на `localhost`

## 3. Проверка доступности бекенда

Убедитесь, что ваш бекенд доступен из интернета:

```bash
curl https://api.yourdomain.com/health
```

Должен вернуть `OK`.

## 4. Настройка Helmet и CORS

Код уже настроен для работы с Telegram Mini App:
- CORS разрешает запросы от `telegram.org` доменов
- Helmet настроен с правильными CSP заголовками
- Разрешены запросы без origin (для мобильных приложений)

## 5. Проверка initData валидации

В продакшене (`NODE_ENV !== 'development'`) бекенд будет валидировать `initData` с помощью токена бота.

Убедитесь, что:
- `TELEGRAM_BOT_TOKEN` установлен в `.env`
- Токен соответствует боту, который используется в Mini App

## 6. Логирование

Бекенд теперь логирует все запросы авторизации. Проверьте логи:

```bash
# В логах вы увидите:
# Auth request: { origin: '...', userAgent: '...', hasInitData: true }
```

## 7. Частые проблемы

### Проблема: CORS ошибка
**Решение:** Добавьте домен Telegram Mini App в `CORS_ORIGIN`

### Проблема: Network Error
**Решение:** 
1. Проверьте, что бекенд доступен из интернета
2. Проверьте, что используется HTTPS
3. Проверьте настройки файрвола/nginx

### Проблема: Invalid initData
**Решение:**
1. Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
2. Проверьте, что `initData` передается корректно из фронтенда

## 8. Тестирование локально

Для тестирования Telegram Mini App локально можно использовать:
- ngrok для туннелирования: `ngrok http 3001`
- Указать ngrok URL в настройках бота в BotFather

