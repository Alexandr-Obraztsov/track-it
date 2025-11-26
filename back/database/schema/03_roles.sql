-- ============================================
-- Таблица: roles
-- Описание: Роли пользователей (например: разработчик, дизайнер, менеджер)
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_roles_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_roles_title ON roles(title);

-- Комментарии
COMMENT ON TABLE roles IS 'Роли пользователей в системе';
COMMENT ON COLUMN roles.id IS 'Уникальный идентификатор роли';
COMMENT ON COLUMN roles.title IS 'Название роли (уникальное)';
COMMENT ON COLUMN roles.created_at IS 'Дата и время создания записи';

