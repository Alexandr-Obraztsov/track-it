-- ============================================
-- Таблица: task_comments
-- Описание: Комментарии к задачам
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_task_comments_task_id_positive CHECK (task_id > 0),
    CONSTRAINT chk_task_comments_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_task_comments_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT chk_task_comments_content_max_length CHECK (LENGTH(content) <= 10000),
    CONSTRAINT chk_task_comments_edited_at_valid CHECK (
        (edited = FALSE AND edited_at IS NULL) OR
        (edited = TRUE AND edited_at IS NOT NULL)
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON task_comments(task_id, created_at DESC);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
-- ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE task_comments IS 'Комментарии к задачам';
COMMENT ON COLUMN task_comments.id IS 'Уникальный идентификатор комментария';
COMMENT ON COLUMN task_comments.task_id IS 'ID задачи, к которой относится комментарий';
COMMENT ON COLUMN task_comments.user_id IS 'ID пользователя, который оставил комментарий';
COMMENT ON COLUMN task_comments.content IS 'Содержимое комментария (максимум 10000 символов)';
COMMENT ON COLUMN task_comments.edited IS 'Флаг редактирования комментария';
COMMENT ON COLUMN task_comments.edited_at IS 'Дата и время последнего редактирования';
COMMENT ON COLUMN task_comments.created_at IS 'Дата и время создания комментария';



