-- ============================================
-- Таблица: user_tasks
-- Описание: Связь пользователей с личными задачами
-- ============================================

CREATE TABLE IF NOT EXISTS user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_user_tasks_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_user_tasks_task_id_positive CHECK (task_id > 0),
    
    -- Уникальность: одна задача не может быть назначена одному пользователю дважды
    CONSTRAINT uq_user_tasks_user_task UNIQUE (user_id, task_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_created_at ON user_tasks(created_at);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE user_tasks ADD CONSTRAINT fk_user_tasks_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE user_tasks ADD CONSTRAINT fk_user_tasks_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE user_tasks IS 'Связь пользователей с личными задачами';
COMMENT ON COLUMN user_tasks.id IS 'Уникальный идентификатор связи';
COMMENT ON COLUMN user_tasks.user_id IS 'ID пользователя';
COMMENT ON COLUMN user_tasks.task_id IS 'ID задачи';
COMMENT ON COLUMN user_tasks.created_at IS 'Дата и время создания связи';

