-- ============================================
-- Таблица: tasks
-- Описание: Задачи пользователей
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    chat_id BIGINT,
    assigned_user_id INTEGER,
    assigned_role_id INTEGER,
    label_id INTEGER,
    deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'backlog',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT chk_tasks_title_length CHECK (LENGTH(TRIM(title)) <= 255),
    CONSTRAINT chk_tasks_status_valid CHECK (status IN ('backlog', 'in_progress', 'completed')),
    CONSTRAINT chk_tasks_deadline_future CHECK (
        deadline IS NULL OR 
        deadline >= CURRENT_DATE
    ),
    CONSTRAINT chk_tasks_assigned_user_id_positive CHECK (
        assigned_user_id IS NULL OR 
        assigned_user_id > 0
    ),
    CONSTRAINT chk_tasks_assigned_role_id_positive CHECK (
        assigned_role_id IS NULL OR 
        assigned_role_id > 0
    ),
    CONSTRAINT chk_tasks_label_id_positive CHECK (
        label_id IS NULL OR 
        label_id > 0
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tasks_chat_id ON tasks(chat_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id ON tasks(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_role_id ON tasks(assigned_role_id) WHERE assigned_role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_label_id ON tasks(label_id) WHERE label_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_chat_id 
--     FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL;
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_user_id 
--     FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL;
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_role_id 
--     FOREIGN KEY (assigned_role_id) REFERENCES roles(id) ON DELETE SET NULL;
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_label_id 
--     FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE SET NULL;

-- Комментарии
COMMENT ON TABLE tasks IS 'Задачи пользователей';
COMMENT ON COLUMN tasks.id IS 'Уникальный идентификатор задачи';
COMMENT ON COLUMN tasks.title IS 'Название задачи';
COMMENT ON COLUMN tasks.description IS 'Подробное описание задачи';
COMMENT ON COLUMN tasks.chat_id IS 'ID чата, к которому относится задача';
COMMENT ON COLUMN tasks.assigned_user_id IS 'ID пользователя, на которого назначена задача';
COMMENT ON COLUMN tasks.assigned_role_id IS 'ID роли, на которую назначена задача';
COMMENT ON COLUMN tasks.label_id IS 'ID метки задачи';
COMMENT ON COLUMN tasks.deadline IS 'Срок выполнения задачи';
COMMENT ON COLUMN tasks.status IS 'Статус задачи: backlog, in_progress, completed';
COMMENT ON COLUMN tasks.created_at IS 'Дата и время создания задачи';

