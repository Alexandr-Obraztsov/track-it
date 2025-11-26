-- ============================================
-- Скрипт создания всей базы данных
-- Описание: Создает все таблицы, индексы, constraints и foreign keys
-- Порядок выполнения важен из-за зависимостей между таблицами
-- ============================================

-- Включаем расширения PostgreSQL (если нужно)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание таблиц в правильном порядке
\i 01_users.sql
\i 02_chats.sql
\i 03_roles.sql
\i 04_labels.sql
\i 05_tasks.sql
\i 06_user_chat_roles.sql
\i 07_chat_roles.sql
\i 08_user_tasks.sql
\i 09_chat_tasks.sql
\i 10_notification_settings.sql
\i 11_task_history.sql
\i 13_task_comments.sql
\i 14_task_attachments.sql
\i 15_subtasks.sql
\i 16_task_favorites.sql

-- Добавление foreign keys после создания всех таблиц
\i 12_foreign_keys.sql

-- Создание триггеров для автоматического обновления истории
\i 17_task_history_triggers.sql

-- Комментарий
COMMENT ON DATABASE current_database() IS 'Track-It: Система управления задачами для Telegram Mini App';

