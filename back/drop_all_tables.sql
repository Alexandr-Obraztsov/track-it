-- Скрипт для полной очистки базы данных
-- Удаляет все таблицы в правильном порядке с учетом внешних ключей

-- Отключаем проверку внешних ключей для безопасного удаления
SET session_replication_role = 'replica';

-- Удаляем таблицы с зависимостями (связующие таблицы и таблицы с внешними ключами)
DROP TABLE IF EXISTS task_favorites CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;
DROP TABLE IF EXISTS task_attachments CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS chat_tasks CASCADE;
DROP TABLE IF EXISTS user_tasks CASCADE;
DROP TABLE IF EXISTS user_chat_roles CASCADE;
DROP TABLE IF EXISTS chat_roles CASCADE;

-- Удаляем основные таблицы
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Включаем обратно проверку внешних ключей
SET session_replication_role = 'origin';

-- Выводим сообщение об успешном завершении
DO $$
BEGIN
    RAISE NOTICE 'Все таблицы успешно удалены';
END $$;






