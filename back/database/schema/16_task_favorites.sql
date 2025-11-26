-- ============================================
-- Таблица: task_favorites
-- Описание: Избранные задачи пользователей
-- ============================================

CREATE TABLE IF NOT EXISTS task_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_task_favorites_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_task_favorites_task_id_positive CHECK (task_id > 0),
    
    -- Уникальность: один пользователь не может добавить одну задачу в избранное дважды
    CONSTRAINT uq_task_favorites_user_task UNIQUE (user_id, task_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_task_favorites_user_id ON task_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_task_favorites_task_id ON task_favorites(task_id);
CREATE INDEX IF NOT EXISTS idx_task_favorites_created_at ON task_favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_favorites_user_created ON task_favorites(user_id, created_at DESC);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE task_favorites ADD CONSTRAINT fk_task_favorites_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE task_favorites ADD CONSTRAINT fk_task_favorites_task_id 
--     FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE task_favorites IS 'Избранные задачи пользователей';
COMMENT ON COLUMN task_favorites.id IS 'Уникальный идентификатор записи';
COMMENT ON COLUMN task_favorites.user_id IS 'ID пользователя';
COMMENT ON COLUMN task_favorites.task_id IS 'ID задачи, добавленной в избранное';
COMMENT ON COLUMN task_favorites.created_at IS 'Дата и время добавления в избранное';

