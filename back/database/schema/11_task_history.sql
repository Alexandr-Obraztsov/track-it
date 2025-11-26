-- ============================================
-- Таблица: task_history
-- Описание: История изменений задач (аудит)
-- ============================================

CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    changed_by_user_id INTEGER,
    field VARCHAR(64) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_task_history_task_id_positive CHECK (task_id > 0),
    CONSTRAINT chk_task_history_changed_by_user_id_positive CHECK (
        changed_by_user_id IS NULL OR 
        changed_by_user_id > 0
    ),
    CONSTRAINT chk_task_history_field_not_empty CHECK (LENGTH(TRIM(field)) > 0),
    CONSTRAINT chk_task_history_field_length CHECK (LENGTH(TRIM(field)) <= 64),
    CONSTRAINT chk_task_history_change_type_valid CHECK (change_type IN ('create', 'update')),
    CONSTRAINT chk_task_history_old_new_value CHECK (
        (old_value IS NOT NULL OR new_value IS NOT NULL)
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_by_user_id ON task_history(changed_by_user_id) WHERE changed_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_history_field ON task_history(field);
CREATE INDEX IF NOT EXISTS idx_task_history_change_type ON task_history(change_type);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_task_created ON task_history(task_id, created_at DESC);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE task_history ADD CONSTRAINT fk_task_history_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
-- ALTER TABLE task_history ADD CONSTRAINT fk_task_history_changed_by_user_id 
--     FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Комментарии
COMMENT ON TABLE task_history IS 'История изменений задач (аудит всех изменений)';
COMMENT ON COLUMN task_history.id IS 'Уникальный идентификатор записи истории';
COMMENT ON COLUMN task_history.task_id IS 'ID задачи, для которой записано изменение';
COMMENT ON COLUMN task_history.changed_by_user_id IS 'ID пользователя, который внес изменение (NULL если неизвестно)';
COMMENT ON COLUMN task_history.field IS 'Название поля, которое было изменено';
COMMENT ON COLUMN task_history.old_value IS 'Старое значение поля (NULL для создания)';
COMMENT ON COLUMN task_history.new_value IS 'Новое значение поля';
COMMENT ON COLUMN task_history.change_type IS 'Тип изменения: create (создание) или update (обновление)';
COMMENT ON COLUMN task_history.created_at IS 'Дата и время изменения';

