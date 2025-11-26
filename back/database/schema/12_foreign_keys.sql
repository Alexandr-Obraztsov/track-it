-- ============================================
-- Foreign Keys (Внешние ключи)
-- Описание: Связи между таблицами
-- ============================================

-- Связи для таблицы labels
ALTER TABLE labels 
    ADD CONSTRAINT fk_labels_chat_id 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

-- Связи для таблицы tasks
ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_chat_id 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL;

ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_assigned_user_id 
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_assigned_role_id 
    FOREIGN KEY (assigned_role_id) REFERENCES roles(id) ON DELETE SET NULL;

ALTER TABLE tasks 
    ADD CONSTRAINT fk_tasks_label_id 
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE SET NULL;

-- Связи для таблицы user_chat_roles
ALTER TABLE user_chat_roles 
    ADD CONSTRAINT fk_user_chat_roles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_chat_roles 
    ADD CONSTRAINT fk_user_chat_roles_chat_id 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE user_chat_roles 
    ADD CONSTRAINT fk_user_chat_roles_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Связи для таблицы chat_roles
ALTER TABLE chat_roles 
    ADD CONSTRAINT fk_chat_roles_chat_id 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_roles 
    ADD CONSTRAINT fk_chat_roles_role_id 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Связи для таблицы user_tasks
ALTER TABLE user_tasks 
    ADD CONSTRAINT fk_user_tasks_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_tasks 
    ADD CONSTRAINT fk_user_tasks_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Связи для таблицы chat_tasks
ALTER TABLE chat_tasks 
    ADD CONSTRAINT fk_chat_tasks_chat_id 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE chat_tasks 
    ADD CONSTRAINT fk_chat_tasks_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Связи для таблицы notification_settings
ALTER TABLE notification_settings 
    ADD CONSTRAINT fk_notification_settings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Связи для таблицы task_history
ALTER TABLE task_history 
    ADD CONSTRAINT fk_task_history_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_history 
    ADD CONSTRAINT fk_task_history_changed_by_user_id 
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Связи для таблицы task_comments
ALTER TABLE task_comments 
    ADD CONSTRAINT fk_task_comments_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_comments 
    ADD CONSTRAINT fk_task_comments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Связи для таблицы task_attachments
ALTER TABLE task_attachments 
    ADD CONSTRAINT fk_task_attachments_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_attachments 
    ADD CONSTRAINT fk_task_attachments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Связи для таблицы subtasks
ALTER TABLE subtasks 
    ADD CONSTRAINT fk_subtasks_parent_task_id 
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Связи для таблицы task_favorites
ALTER TABLE task_favorites 
    ADD CONSTRAINT fk_task_favorites_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE task_favorites 
    ADD CONSTRAINT fk_task_favorites_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

