-- ============================================
-- Таблица: subtasks
-- Описание: Подзадачи (разбиение больших задач на подзадачи)
-- ============================================

CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    parent_task_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- CHECK constraints
    CONSTRAINT chk_subtasks_parent_task_id_positive CHECK (parent_task_id > 0),
    CONSTRAINT chk_subtasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_subtasks_title_length CHECK (LENGTH(TRIM(title)) <= 255),
    CONSTRAINT chk_subtasks_status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT chk_subtasks_order_index_non_negative CHECK (order_index >= 0),
    CONSTRAINT chk_subtasks_completed_at_valid CHECK (
        (status != 'completed' AND completed_at IS NULL) OR
        (status = 'completed' AND completed_at IS NOT NULL)
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task_id ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(parent_task_id, order_index);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE subtasks ADD CONSTRAINT fk_subtasks_parent_task_id 
--     FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE subtasks IS 'Подзадачи (разбиение больших задач на подзадачи)';
COMMENT ON COLUMN subtasks.id IS 'Уникальный идентификатор подзадачи';
COMMENT ON COLUMN subtasks.parent_task_id IS 'ID родительской задачи';
COMMENT ON COLUMN subtasks.title IS 'Название подзадачи';
COMMENT ON COLUMN subtasks.description IS 'Подробное описание подзадачи';
COMMENT ON COLUMN subtasks.status IS 'Статус подзадачи: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN subtasks.order_index IS 'Порядок отображения подзадачи (для сортировки)';
COMMENT ON COLUMN subtasks.created_at IS 'Дата и время создания подзадачи';
COMMENT ON COLUMN subtasks.updated_at IS 'Дата и время последнего обновления';
COMMENT ON COLUMN subtasks.completed_at IS 'Дата и время завершения подзадачи';

