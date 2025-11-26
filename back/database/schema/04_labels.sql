-- ============================================
-- Таблица: labels
-- Описание: Метки для задач (например: фронтенд, бекенд, delivery service)
-- ============================================

CREATE TABLE IF NOT EXISTS labels (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    name VARCHAR(64) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_labels_chat_id_positive CHECK (chat_id > 0),
    CONSTRAINT chk_labels_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_labels_name_length CHECK (LENGTH(TRIM(name)) <= 64),
    CONSTRAINT chk_labels_color_format CHECK (
        color IS NULL OR 
        (LENGTH(color) = 7 AND color ~ '^#[0-9A-Fa-f]{6}$')
    ),
    -- Уникальность имени метки в рамках одного чата
    CONSTRAINT uq_labels_chat_name UNIQUE (chat_id, name)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_labels_chat_id ON labels(chat_id);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(name);

-- Foreign keys (будут добавлены после создания таблицы chats)
-- ALTER TABLE labels ADD CONSTRAINT fk_labels_chat_id 
--     FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE labels IS 'Метки для задач (категории, теги)';
COMMENT ON COLUMN labels.id IS 'Уникальный идентификатор метки';
COMMENT ON COLUMN labels.chat_id IS 'ID чата, к которому принадлежит метка';
COMMENT ON COLUMN labels.name IS 'Название метки (уникально в рамках чата)';
COMMENT ON COLUMN labels.color IS 'Цвет метки в формате HEX (#RRGGBB)';
COMMENT ON COLUMN labels.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN labels.updated_at IS 'Дата и время последнего обновления';

