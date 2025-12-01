-- ============================================
-- Таблица: notification_settings
-- Описание: Настройки уведомлений для пользователей
-- ============================================

CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    daily_digest_time VARCHAR(5) NOT NULL DEFAULT '09:00',
    deadline_reminder_hours INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- CHECK constraints
    CONSTRAINT chk_notification_settings_user_id_positive CHECK (user_id > 0),
    CONSTRAINT chk_notification_settings_daily_digest_time_format CHECK (
        daily_digest_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
    ),
    CONSTRAINT chk_notification_settings_deadline_reminder_hours_valid CHECK (
        deadline_reminder_hours IS NULL OR
        (
            array_length(deadline_reminder_hours, 1) IS NULL OR
            (SELECT bool_and(hour >= 0 AND hour <= 8760) FROM unnest(deadline_reminder_hours) AS hour)
        )
    )
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Foreign keys (будут добавлены после создания таблицы users)
-- ALTER TABLE notification_settings ADD CONSTRAINT fk_notification_settings_user_id 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Комментарии
COMMENT ON TABLE notification_settings IS 'Настройки уведомлений для пользователей';
COMMENT ON COLUMN notification_settings.id IS 'Уникальный идентификатор настройки';
COMMENT ON COLUMN notification_settings.user_id IS 'ID пользователя (уникальный)';
COMMENT ON COLUMN notification_settings.daily_digest_time IS 'Время ежедневного получения списка задач (формат HH:mm)';
COMMENT ON COLUMN notification_settings.deadline_reminder_hours IS 'Массив часов до дедлайна для напоминаний';
COMMENT ON COLUMN notification_settings.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN notification_settings.updated_at IS 'Дата и время последнего обновления';



