-- ============================================
-- Таблица: chats
-- Описание: Чаты/группы в Telegram
-- ============================================

CREATE TABLE IF NOT EXISTS chats (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_chats_id_positive CHECK (id > 0),
    CONSTRAINT chk_chats_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_chats_message_id_positive CHECK (message_id > 0)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_chats_title ON chats(title);
CREATE INDEX IF NOT EXISTS idx_chats_message_id ON chats(message_id);

-- Комментарии
COMMENT ON TABLE chats IS 'Чаты/группы в Telegram';
COMMENT ON COLUMN chats.id IS 'Telegram Chat ID (используется как первичный ключ)';
COMMENT ON COLUMN chats.title IS 'Название чата/группы';
COMMENT ON COLUMN chats.message_id IS 'ID сообщения, связанного с чатом';
COMMENT ON COLUMN chats.created_at IS 'Дата и время создания записи';



