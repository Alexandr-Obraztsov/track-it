-- ============================================
-- Таблица: task_attachments
-- Описание: Вложения/файлы к задачам
-- ============================================

CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_task_attachments_task_id_positive CHECK (task_id > 0),
    CONSTRAINT chk_task_attachments_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_task_attachments_file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
    CONSTRAINT chk_task_attachments_file_path_not_empty CHECK (LENGTH(TRIM(file_path)) > 0),
    CONSTRAINT chk_task_attachments_file_size_positive CHECK (file_size > 0),
    CONSTRAINT chk_task_attachments_file_size_max CHECK (file_size <= 104857600), -- 100 MB максимум
    CONSTRAINT chk_task_attachments_file_name_length CHECK (LENGTH(TRIM(file_name)) <= 255),
    CONSTRAINT chk_task_attachments_file_path_length CHECK (LENGTH(TRIM(file_path)) <= 1000)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_at ON task_attachments(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_attachments_file_type ON task_attachments(file_type) WHERE file_type IS NOT NULL;

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE task_attachments ADD CONSTRAINT fk_task_attachments_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
-- ALTER TABLE task_attachments ADD CONSTRAINT fk_task_attachments_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE task_attachments IS 'Вложения/файлы к задачам';
COMMENT ON COLUMN task_attachments.id IS 'Уникальный идентификатор вложения';
COMMENT ON COLUMN task_attachments.task_id IS 'ID задачи, к которой относится вложение';
COMMENT ON COLUMN task_attachments.user_id IS 'ID пользователя, который загрузил файл';
COMMENT ON COLUMN task_attachments.file_name IS 'Имя файла';
COMMENT ON COLUMN task_attachments.file_path IS 'Путь к файлу на сервере';
COMMENT ON COLUMN task_attachments.file_size IS 'Размер файла в байтах (максимум 100 MB)';
COMMENT ON COLUMN task_attachments.file_type IS 'Тип файла (расширение)';
COMMENT ON COLUMN task_attachments.mime_type IS 'MIME тип файла';
COMMENT ON COLUMN task_attachments.uploaded_at IS 'Дата и время загрузки файла';



