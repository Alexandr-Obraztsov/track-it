# Примеры использования исторической таблицы

## Настройка user_id перед операциями

### В TypeORM/приложении

```typescript
// Перед выполнением операции с задачей
await AppDataSource.query(`SET LOCAL task_history.user_id = ${userId}`);

// Выполняем операцию
await taskRepository.save(task);

// Переменная автоматически сбросится после транзакции
```

### В чистом SQL

```sql
BEGIN;

-- Устанавливаем user_id для истории
SET LOCAL task_history.user_id = 123;

-- Создаем задачу (автоматически запишется в историю)
INSERT INTO tasks (title, description, status, chat_id)
VALUES ('Новая задача', 'Описание задачи', 'backlog', 1);

COMMIT;
```

## Просмотр истории задачи

```sql
-- Получить всю историю задачи
SELECT 
    th.id,
    th.field,
    th.old_value,
    th.new_value,
    th.change_type,
    th.created_at,
    u.first_name || ' ' || COALESCE(u.last_name, '') as changed_by
FROM task_history th
LEFT JOIN users u ON th.changed_by_user_id = u.id
WHERE th.task_id = 1
ORDER BY th.created_at DESC;
```

## Получить последние изменения

```sql
-- Последние 10 изменений по всем задачам
SELECT 
    t.id as task_id,
    t.title as task_title,
    th.field,
    th.old_value,
    th.new_value,
    th.change_type,
    th.created_at,
    u.first_name || ' ' || COALESCE(u.last_name, '') as changed_by
FROM task_history th
JOIN tasks t ON th.task_id = t.id
LEFT JOIN users u ON th.changed_by_user_id = u.id
ORDER BY th.created_at DESC
LIMIT 10;
```

## История изменений конкретного поля

```sql
-- История изменений статуса задачи
SELECT 
    th.old_value as old_status,
    th.new_value as new_status,
    th.created_at,
    u.first_name || ' ' || COALESCE(u.last_name, '') as changed_by
FROM task_history th
LEFT JOIN users u ON th.changed_by_user_id = u.id
WHERE th.task_id = 1 
  AND th.field = 'status'
ORDER BY th.created_at DESC;
```

## Кто и когда изменил задачу

```sql
-- Все пользователи, которые вносили изменения в задачу
SELECT DISTINCT
    u.id,
    u.first_name || ' ' || COALESCE(u.last_name, '') as user_name,
    COUNT(*) as changes_count,
    MIN(th.created_at) as first_change,
    MAX(th.created_at) as last_change
FROM task_history th
JOIN users u ON th.changed_by_user_id = u.id
WHERE th.task_id = 1
GROUP BY u.id, u.first_name, u.last_name
ORDER BY changes_count DESC;
```

## Статистика изменений

```sql
-- Статистика изменений по типам полей
SELECT 
    field,
    change_type,
    COUNT(*) as changes_count
FROM task_history
WHERE task_id = 1
GROUP BY field, change_type
ORDER BY changes_count DESC;
```

## Откат изменений (пример)

```sql
-- Получить последнее значение поля перед изменением
SELECT old_value
FROM task_history
WHERE task_id = 1 
  AND field = 'title'
  AND change_type = 'update'
ORDER BY created_at DESC
LIMIT 1;

-- Восстановить значение
UPDATE tasks 
SET title = (
    SELECT old_value
    FROM task_history
    WHERE task_id = tasks.id 
      AND field = 'title'
      AND change_type = 'update'
    ORDER BY created_at DESC
    LIMIT 1
)
WHERE id = 1;
```

## Массовые операции с историей

```sql
-- Установить user_id для всех операций в транзакции
BEGIN;
SET LOCAL task_history.user_id = 123;

-- Множественные операции
UPDATE tasks SET status = 'in_progress' WHERE id IN (1, 2, 3);
UPDATE tasks SET assigned_user_id = 123 WHERE id = 4;
INSERT INTO tasks (title, status, chat_id) VALUES ('Task 5', 'backlog', 1);

COMMIT; -- Все изменения будут записаны с user_id = 123
```

## Проверка работы триггеров

```sql
-- Создать задачу без установки user_id
INSERT INTO tasks (title, description, status, chat_id)
VALUES ('Test Task', 'Test Description', 'backlog', 1)
RETURNING id;

-- Проверить, что запись появилась в истории
SELECT * FROM task_history WHERE task_id = (SELECT MAX(id) FROM tasks);

-- Обновить задачу с установкой user_id
SET LOCAL task_history.user_id = 123;
UPDATE tasks SET title = 'Updated Title' WHERE id = (SELECT MAX(id) FROM tasks);

-- Проверить историю с user_id
SELECT * FROM task_history WHERE task_id = (SELECT MAX(id) FROM tasks) ORDER BY created_at DESC;
```

