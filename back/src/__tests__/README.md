# Тесты Backend

## Запуск тестов

```bash
# Все тесты
pnpm test

# В режиме watch
pnpm test:watch

# С покрытием
pnpm test:coverage
```

## Структура тестов

Тесты организованы по модулям:
- `routes/` - тесты для API endpoints
- `services/` - тесты для бизнес-логики
- `utils/` - тесты для утилит

## Написание тестов

### Пример теста для route

```typescript
import request from 'supertest';
import express from 'express';
import { taskRoutes } from '../../routes/tasks';

const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('Tasks Routes', () => {
  it('should return tasks', async () => {
    const response = await request(app)
      .get('/api/tasks?chatId=1');
    
    expect(response.status).toBe(200);
  });
});
```

## Моки

Используются моки для:
- Базы данных (можно использовать in-memory БД для тестов)
- Внешних сервисов (Telegram Bot, Gemini AI)
- Middleware (auth)

## Покрытие

Целевое покрытие кода: > 80%

Исключения из покрытия:
- `server.ts` - точка входа
- `scripts/` - скрипты миграций

