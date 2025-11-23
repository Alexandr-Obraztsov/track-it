# Track-It Frontend

Frontend приложение для управления задачами, построенное на React, TypeScript, Material-UI и Storybook.

## Структура проекта

Проект организован по принципу **Atomic Design**:

```
src/
├── components/
│   ├── atoms/          # Базовые компоненты
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx  # Story рядом с компонентом
│   │   │   └── index.ts
│   │   ├── Chip/
│   │   └── IconButton/
│   ├── molecules/      # Комбинации атомов
│   │   ├── StatusChip/
│   │   │   ├── StatusChip.tsx
│   │   │   ├── StatusChip.stories.tsx  # Story рядом с компонентом
│   │   │   └── index.ts
│   │   ├── UserChip/
│   │   ├── DeadlineChip/
│   │   └── TaskActions/
│   ├── organisms/      # Комплексные компоненты
│   │   ├── TaskCard/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskCard.stories.tsx  # Story рядом с компонентом
│   │   │   └── index.ts
│   │   ├── TaskForm/
│   │   └── TaskList/
│   └── templates/      # Шаблоны страниц (будут добавлены)
├── pages/              # Страницы приложения
├── hooks/              # React хуки
├── utils/              # Утилиты
├── types/              # TypeScript типы
├── api/                # API клиенты
└── theme/              # Тема MUI
```

## Компоненты

### Atoms (Атомы)
Базовые, неделимые компоненты:
- `Button` - кнопка
- `Chip` - чип/тег
- `IconButton` - кнопка с иконкой

### Molecules (Молекулы)
Комбинации атомов:
- `StatusChip` - чип статуса задачи
- `UserChip` - чип пользователя
- `DeadlineChip` - чип дедлайна
- `TaskActions` - действия с задачей (редактирование, удаление)

### Organisms (Организмы)
Комплексные компоненты:
- `TaskCard` - карточка задачи
- `TaskForm` - форма создания/редактирования задачи
- `TaskList` - список задач с табами

## Установка и запуск

```bash
# Установка зависимостей
pnpm install

# Создайте файл .env на основе .env.example
cp .env.example .env

# Запуск dev сервера
pnpm dev

# Запуск Storybook
pnpm storybook

# Сборка для production
pnpm build
```

## Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта `front/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api

# Mock Mode
# Set to 'true', '1', or 'yes' to use mock data instead of real API
# Default: false (uses real API)
VITE_USE_MOCKS=false
```

### Режим моков

Для разработки можно использовать моки вместо реального API:

- `VITE_USE_MOCKS=false` (по умолчанию) - использует реальный API
- `VITE_USE_MOCKS=true` - использует моки из `src/mocks/data.ts`

Это полезно для:
- Разработки без запущенного бекенда
- Тестирования UI без подключения к базе данных
- Демонстрации функциональности

## Технологии

- **React 19** - UI библиотека
- **TypeScript** - типизация
- **Material-UI v7** - компоненты и тема
- **Vite** - сборщик
- **Storybook** - документация компонентов
- **date-fns** - работа с датами

## Storybook

Все stories находятся **в той же папке, что и компонент**, что обеспечивает лучшую организацию кода:
- Каждый компонент имеет свою папку
- Story файл (`Component.stories.tsx`) находится рядом с компонентом
- Это упрощает навигацию и поддержку кода

Пример структуры:
```
components/
  molecules/
    StatusChip/
      StatusChip.tsx
      StatusChip.stories.tsx  ← Story здесь
      index.ts
```

Запуск Storybook: `pnpm storybook`
