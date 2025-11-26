# SQL Schema для Track-It

Этот каталог содержит SQL-схему базы данных для системы управления задачами Track-It.

## Структура базы данных

База данных состоит из **15 таблиц**:

### Основные таблицы

1. **users** - Пользователи системы (Telegram пользователи)
2. **chats** - Чаты/группы в Telegram
3. **roles** - Роли пользователей (разработчик, дизайнер, менеджер и т.д.)
4. **labels** - Метки для задач (фронтенд, бекенд, delivery service и т.д.)
5. **tasks** - Задачи пользователей

### Промежуточные таблицы (связи)

6. **user_chat_roles** - Связь пользователей с ролями в конкретных чатах
7. **chat_roles** - Роли, доступные в конкретном чате
8. **user_tasks** - Связь пользователей с личными задачами
9. **chat_tasks** - Связь чатов с задачами

### Вспомогательные таблицы

10. **notification_settings** - Настройки уведомлений для пользователей
11. **task_history** - История изменений задач (аудит)

### Функциональные таблицы

12. **task_comments** - Комментарии к задачам
13. **task_attachments** - Вложения/файлы к задачам
14. **subtasks** - Подзадачи (разбиение больших задач на подзадачи)
15. **task_favorites** - Избранные задачи пользователей

## Файлы схемы

- `00_create_all.sql` - Главный скрипт, который создает всю базу данных
- `01_users.sql` - Таблица пользователей
- `02_chats.sql` - Таблица чатов
- `03_roles.sql` - Таблица ролей
- `04_labels.sql` - Таблица меток
- `05_tasks.sql` - Таблица задач
- `06_user_chat_roles.sql` - Связь пользователей с ролями в чатах
- `07_chat_roles.sql` - Роли в чатах
- `08_user_tasks.sql` - Личные задачи пользователей
- `09_chat_tasks.sql` - Задачи в чатах
- `10_notification_settings.sql` - Настройки уведомлений
- `11_task_history.sql` - История изменений задач
- `12_foreign_keys.sql` - Все внешние ключи (связи между таблицами)
- `13_task_comments.sql` - Комментарии к задачам
- `14_task_attachments.sql` - Вложения/файлы к задачам
- `15_subtasks.sql` - Подзадачи
- `16_task_favorites.sql` - Избранные задачи
- `17_task_history_triggers.sql` - Триггеры для автоматического обновления истории

## Особенности реализации

### CHECK Constraints

Все таблицы содержат CHECK constraints для валидации данных:
- Проверка положительных значений для ID
- Проверка непустых строк
- Проверка форматов (email, HEX цвета, время)
- Проверка допустимых значений (статусы, типы изменений)

### DEFAULT значения

- `created_at` - автоматически устанавливается в `CURRENT_TIMESTAMP`
- `updated_at` - автоматически обновляется при изменении записи
- `status` в tasks - по умолчанию `'backlog'`
- `daily_digest_time` в notification_settings - по умолчанию `'09:00'`

### Индексы

Созданы индексы для:
- Первичных и внешних ключей
- Часто используемых полей для поиска (username, title, status)
- Составных индексов для оптимизации запросов

### Foreign Keys

Все связи между таблицами реализованы через foreign keys с правильными действиями:
- `ON DELETE CASCADE` - для зависимых записей (labels, user_tasks, chat_tasks)
- `ON DELETE SET NULL` - для опциональных связей (assigned_user_id, assigned_role_id)
- `ON DELETE SET NULL` - для истории изменений (changed_by_user_id)

## Диаграмма связей

```
users
  ├── user_chat_roles (many-to-many через промежуточную таблицу)
  │   └── chats
  │   └── roles
  ├── user_tasks (many-to-many через промежуточную таблицу)
  │   └── tasks
  └── notification_settings (one-to-one)

chats
  ├── chat_roles (many-to-many через промежуточную таблицу)
  │   └── roles
  ├── chat_tasks (many-to-many через промежуточную таблицу)
  │   └── tasks
  └── labels (one-to-many)

tasks
  ├── users (assigned_user_id, nullable)
  ├── roles (assigned_role_id, nullable)
  ├── labels (label_id, nullable)
  ├── chats (chat_id, nullable)
  ├── task_history (one-to-many, аудит)
  ├── task_comments (one-to-many, комментарии)
  ├── task_attachments (one-to-many, вложения)
  ├── subtasks (one-to-many, подзадачи)
  └── task_favorites (many-to-many через промежуточную таблицу)
      └── users

roles
  ├── user_chat_roles (many-to-many)
  ├── chat_roles (many-to-many)
  └── tasks (assigned_role_id, nullable)
```

## Историческая база данных

Таблица `task_history` реализует полный аудит изменений задач с **автоматическим обновлением через триггеры PostgreSQL**.

### Автоматическое логирование

Все изменения в таблице `tasks` автоматически записываются в `task_history` через триггеры:

- **INSERT триггер** - при создании задачи записывает все поля как `create`
- **UPDATE триггер** - при обновлении задачи записывает только измененные поля как `update`
- **DELETE триггер** - при удалении задачи записывает факт удаления

### Отслеживаемые поля

- `title` - название задачи
- `description` - описание задачи
- `status` - статус задачи (backlog, in_progress, completed)
- `assigned_user_id` - назначенный пользователь
- `assigned_role_id` - назначенная роль
- `deadline` - дедлайн задачи
- `label_id` - метка задачи

### Использование user_id

Для записи `changed_by_user_id` используется переменная сессии PostgreSQL:

```sql
-- Перед выполнением запроса установите user_id
SET LOCAL task_history.user_id = 123;

-- Теперь все изменения будут записаны с этим user_id
INSERT INTO tasks (title, description, ...) VALUES (...);
UPDATE tasks SET title = 'New title' WHERE id = 1;
DELETE FROM tasks WHERE id = 1;
```

Если `user_id` не установлен, поле `changed_by_user_id` будет `NULL`.

### Преимущества триггеров

- ✅ Автоматическое логирование всех изменений
- ✅ Не нужно вызывать сервисы вручную
- ✅ Работает на уровне БД, независимо от приложения
- ✅ Гарантированная целостность данных
- ✅ Защита от пропущенных изменений

### Отключение логирования

Если нужно временно отключить логирование:

```sql
ALTER TABLE tasks DISABLE TRIGGER trigger_task_history_insert;
ALTER TABLE tasks DISABLE TRIGGER trigger_task_history_update;
ALTER TABLE tasks DISABLE TRIGGER trigger_task_history_delete;
```

Включение обратно:

```sql
ALTER TABLE tasks ENABLE TRIGGER trigger_task_history_insert;
ALTER TABLE tasks ENABLE TRIGGER trigger_task_history_update;
ALTER TABLE tasks ENABLE TRIGGER trigger_task_history_delete;
```

## Новый функционал

### Комментарии к задачам (task_comments)

Позволяет пользователям оставлять комментарии к задачам:
- Привязка к задаче и пользователю
- Отслеживание редактирования (флаг `edited` и `edited_at`)
- Ограничение длины комментария (максимум 10000 символов)
- Индексы для быстрого поиска комментариев по задаче

### Вложения к задачам (task_attachments)

Возможность прикреплять файлы к задачам:
- Хранение метаданных файла (имя, путь, размер, тип)
- Ограничение размера файла (максимум 100 MB)
- MIME-тип для правильной обработки файлов
- Автоматическое отслеживание пользователя, загрузившего файл

### Подзадачи (subtasks)

Разбиение больших задач на подзадачи:
- Иерархическая структура (родительская задача → подзадачи)
- Собственные статусы: `pending`, `in_progress`, `completed`, `cancelled`
- Порядок отображения (`order_index`) для сортировки
- Автоматическое отслеживание даты завершения (`completed_at`)
- Защита от циклических ссылок

### Избранные задачи (task_favorites)

Пользователи могут помечать задачи как избранные:
- Быстрый доступ к важным задачам
- Уникальность (один пользователь не может добавить задачу дважды)
- Сортировка по дате добавления

## Использование

### Создание всей базы данных

```bash
psql -U postgres -d track_it -f 00_create_all.sql
```

### Создание отдельных таблиц

```bash
psql -U postgres -d track_it -f 01_users.sql
psql -U postgres -d track_it -f 02_chats.sql
# и т.д.
```

### Создание только foreign keys

```bash
psql -U postgres -d track_it -f 12_foreign_keys.sql
```

## Примечания

- Все SQL файлы используют `CREATE TABLE IF NOT EXISTS` для безопасного выполнения
- Индексы создаются с `CREATE INDEX IF NOT EXISTS`
- Foreign keys добавляются отдельным скриптом после создания всех таблиц
- Все временные метки используют `TIMESTAMP WITH TIME ZONE`
- Проверки форматов используют регулярные выражения PostgreSQL

## Требования

- PostgreSQL 12+
- Права на создание таблиц, индексов и constraints

