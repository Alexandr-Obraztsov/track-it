-- ============================================
-- Таблица: chat_tasks
-- Описание: Связь чатов с задачами (промежуточная таблица)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_tasks (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_chat_tasks_chat_id_positive CHECK (chat_id > 0),
    CONSTRAINT chk_chat_tasks_task_id_positive CHECK (task_id > 0),
    
    -- Уникальность: одна задача не может быть связана с одним чатом дважды
    CONSTRAINT uq_chat_tasks_chat_task UNIQUE (chat_id, task_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_chat_tasks_chat_id ON chat_tasks(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_tasks_task_id ON chat_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_chat_tasks_created_at ON chat_tasks(created_at);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE chat_tasks ADD CONSTRAINT fk_chat_tasks_chat_id 
--     FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
-- ALTER TABLE chat_tasks ADD CONSTRAINT fk_chat_tasks_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE chat_tasks IS 'Связь чатов с задачами (промежуточная таблица)';
COMMENT ON COLUMN chat_tasks.id IS 'Уникальный идентификатор связи';
COMMENT ON COLUMN chat_tasks.chat_id IS 'ID чата';
COMMENT ON COLUMN chat_tasks.task_id IS 'ID задачи';
COMMENT ON COLUMN chat_tasks.created_at IS 'Дата и время создания связи';

