-- ============================================
-- Таблица: chat_roles
-- Описание: Роли, доступные в конкретном чате
-- ============================================

CREATE TABLE IF NOT EXISTS chat_roles (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    role_id INTEGER NOT NULL,
    
    -- CHECK constraints
    CONSTRAINT chk_chat_roles_chat_id_positive CHECK (chat_id > 0),
    CONSTRAINT chk_chat_roles_role_id_positive CHECK (role_id > 0),
    
    -- Уникальность: одна роль не может быть добавлена в чат дважды
    CONSTRAINT uq_chat_roles_chat_role UNIQUE (chat_id, role_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_chat_roles_chat_id ON chat_roles(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_roles_role_id ON chat_roles(role_id);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE chat_roles ADD CONSTRAINT fk_chat_roles_chat_id 
--     FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
-- ALTER TABLE chat_roles ADD CONSTRAINT fk_chat_roles_role_id 
--     FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE chat_roles IS 'Роли, доступные в конкретном чате';
COMMENT ON COLUMN chat_roles.id IS 'Уникальный идентификатор связи';
COMMENT ON COLUMN chat_roles.chat_id IS 'ID чата';
COMMENT ON COLUMN chat_roles.role_id IS 'ID роли';



