-- ============================================
-- Таблица: users
-- Описание: Пользователи системы (Telegram пользователи)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_users_telegram_id_positive CHECK (telegram_id > 0),
    CONSTRAINT chk_users_first_name_not_empty CHECK (LENGTH(TRIM(first_name)) > 0),
    CONSTRAINT chk_users_username_format CHECK (
        username IS NULL OR 
        (LENGTH(TRIM(username)) > 0 AND username ~ '^[a-zA-Z0-9_]+$')
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Комментарии
COMMENT ON TABLE users IS 'Пользователи системы (Telegram пользователи)';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN users.telegram_id IS 'Telegram ID пользователя (уникальный)';
COMMENT ON COLUMN users.username IS 'Имя пользователя в Telegram (опционально)';
COMMENT ON COLUMN users.first_name IS 'Имя пользователя (обязательно)';
COMMENT ON COLUMN users.last_name IS 'Фамилия пользователя (опционально)';
COMMENT ON COLUMN users.photo_url IS 'URL фотографии профиля';
COMMENT ON COLUMN users.created_at IS 'Дата и время создания записи';

