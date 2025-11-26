-- ============================================
-- Таблица: user_chat_roles
-- Описание: Связь пользователей с ролями в конкретных чатах
-- ============================================

CREATE TABLE IF NOT EXISTS user_chat_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    chat_id BIGINT NOT NULL,
    role_id INTEGER NOT NULL,
    
    -- CHECK constraints
    CONSTRAINT chk_user_chat_roles_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_user_chat_roles_chat_id_positive CHECK (chat_id > 0),
    CONSTRAINT chk_user_chat_roles_role_id_positive CHECK (role_id > 0),
    
    -- Уникальность: один пользователь не может иметь одну и ту же роль дважды в одном чате
    CONSTRAINT uq_user_chat_roles_user_chat_role UNIQUE (user_id, chat_id, role_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_user_chat_roles_user_id ON user_chat_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_roles_chat_id ON user_chat_roles(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_roles_role_id ON user_chat_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_chat_roles_user_chat ON user_chat_roles(user_id, chat_id);

-- Foreign keys (будут добавлены после создания связанных таблиц)
-- ALTER TABLE user_chat_roles ADD CONSTRAINT fk_user_chat_roles_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE user_chat_roles ADD CONSTRAINT fk_user_chat_roles_chat_id 
--     FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
-- ALTER TABLE user_chat_roles ADD CONSTRAINT fk_user_chat_roles_role_id 
--     FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE user_chat_roles IS 'Связь пользователей с ролями в конкретных чатах';
COMMENT ON COLUMN user_chat_roles.id IS 'Уникальный идентификатор связи';
COMMENT ON COLUMN user_chat_roles.user_id IS 'ID пользователя';
COMMENT ON COLUMN user_chat_roles.chat_id IS 'ID чата';
COMMENT ON COLUMN user_chat_roles.role_id IS 'ID роли';

