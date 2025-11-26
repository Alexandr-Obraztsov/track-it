-- ============================================
-- Триггеры для автоматического обновления task_history
-- Описание: Автоматически записывает все изменения задач в историю
-- ============================================

-- Функция для получения user_id из контекста сессии
-- Использование: SET LOCAL task_history.user_id = 123; перед выполнением запроса
CREATE OR REPLACE FUNCTION get_task_history_user_id() RETURNS INTEGER AS $$
BEGIN
    RETURN current_setting('task_history.user_id', TRUE)::INTEGER;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для сериализации значения поля (используем TEXT для универсальности)
CREATE OR REPLACE FUNCTION serialize_field_value_text(
    field_value TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN field_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION serialize_field_value_integer(
    field_value INTEGER
) RETURNS TEXT AS $$
BEGIN
    IF field_value IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN field_value::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION serialize_field_value_bigint(
    field_value BIGINT
) RETURNS TEXT AS $$
BEGIN
    IF field_value IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN field_value::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION serialize_field_value_date(
    field_value DATE
) RETURNS TEXT AS $$
BEGIN
    IF field_value IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN field_value::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Функция для логирования создания задачи
CREATE OR REPLACE FUNCTION log_task_creation() RETURNS TRIGGER AS $$
DECLARE
    user_id_val INTEGER;
    field_name TEXT;
    field_value TEXT;
    tracked_fields TEXT[] := ARRAY['title', 'description', 'status', 'assigned_user_id', 'assigned_role_id', 'deadline', 'label_id'];
BEGIN
    user_id_val := get_task_history_user_id();
    
    -- Логируем все отслеживаемые поля
    FOREACH field_name IN ARRAY tracked_fields
    LOOP
        -- Получаем значение поля
        CASE field_name
            WHEN 'title' THEN field_value := serialize_field_value_text(NEW.title);
            WHEN 'description' THEN field_value := serialize_field_value_text(NEW.description);
            WHEN 'status' THEN field_value := serialize_field_value_text(NEW.status);
            WHEN 'assigned_user_id' THEN field_value := serialize_field_value_integer(NEW.assigned_user_id);
            WHEN 'assigned_role_id' THEN field_value := serialize_field_value_integer(NEW.assigned_role_id);
            WHEN 'deadline' THEN field_value := serialize_field_value_date(NEW.deadline);
            WHEN 'label_id' THEN field_value := serialize_field_value_integer(NEW.label_id);
        END CASE;
        
        -- Записываем только если значение не NULL
        IF field_value IS NOT NULL THEN
            INSERT INTO task_history (
                task_id,
                changed_by_user_id,
                field,
                old_value,
                new_value,
                change_type
            ) VALUES (
                NEW.id,
                user_id_val,
                field_name,
                NULL,
                field_value,
                'create'
            );
        END IF;
    END LOOP;
    
    -- Если ни одно поле не было записано, создаем запись о создании задачи
    IF NOT EXISTS (SELECT 1 FROM task_history WHERE task_id = NEW.id AND change_type = 'create') THEN
        INSERT INTO task_history (
            task_id,
            changed_by_user_id,
            field,
            old_value,
            new_value,
            change_type
        ) VALUES (
            NEW.id,
            user_id_val,
            'task',
            NULL,
            'created',
            'create'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для логирования обновления задачи
CREATE OR REPLACE FUNCTION log_task_update() RETURNS TRIGGER AS $$
DECLARE
    user_id_val INTEGER;
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
    tracked_fields TEXT[] := ARRAY['title', 'description', 'status', 'assigned_user_id', 'assigned_role_id', 'deadline', 'label_id'];
BEGIN
    user_id_val := get_task_history_user_id();
    
    -- Логируем только измененные поля
    FOREACH field_name IN ARRAY tracked_fields
    LOOP
        -- Получаем старое и новое значение
        CASE field_name
            WHEN 'title' THEN
                old_value := serialize_field_value_text(OLD.title);
                new_value := serialize_field_value_text(NEW.title);
            WHEN 'description' THEN
                old_value := serialize_field_value_text(OLD.description);
                new_value := serialize_field_value_text(NEW.description);
            WHEN 'status' THEN
                old_value := serialize_field_value_text(OLD.status);
                new_value := serialize_field_value_text(NEW.status);
            WHEN 'assigned_user_id' THEN
                old_value := serialize_field_value_integer(OLD.assigned_user_id);
                new_value := serialize_field_value_integer(NEW.assigned_user_id);
            WHEN 'assigned_role_id' THEN
                old_value := serialize_field_value_integer(OLD.assigned_role_id);
                new_value := serialize_field_value_integer(NEW.assigned_role_id);
            WHEN 'deadline' THEN
                old_value := serialize_field_value_date(OLD.deadline);
                new_value := serialize_field_value_date(NEW.deadline);
            WHEN 'label_id' THEN
                old_value := serialize_field_value_integer(OLD.label_id);
                new_value := serialize_field_value_integer(NEW.label_id);
        END CASE;
        
        -- Записываем только если значение изменилось
        IF (old_value IS DISTINCT FROM new_value) THEN
            INSERT INTO task_history (
                task_id,
                changed_by_user_id,
                field,
                old_value,
                new_value,
                change_type
            ) VALUES (
                NEW.id,
                user_id_val,
                field_name,
                old_value,
                new_value,
                'update'
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Функция для логирования удаления задачи
CREATE OR REPLACE FUNCTION log_task_deletion() RETURNS TRIGGER AS $$
DECLARE
    user_id_val INTEGER;
BEGIN
    user_id_val := get_task_history_user_id();
    
    -- Записываем факт удаления задачи
    INSERT INTO task_history (
        task_id,
        changed_by_user_id,
        field,
        old_value,
        new_value,
        change_type
    ) VALUES (
        OLD.id,
        user_id_val,
        'task',
        'deleted',
        NULL,
        'update'
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Создание триггеров
DROP TRIGGER IF EXISTS trigger_task_history_insert ON tasks;
CREATE TRIGGER trigger_task_history_insert
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_creation();

DROP TRIGGER IF EXISTS trigger_task_history_update ON tasks;
CREATE TRIGGER trigger_task_history_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_update();

DROP TRIGGER IF EXISTS trigger_task_history_delete ON tasks;
CREATE TRIGGER trigger_task_history_delete
    BEFORE DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_deletion();

-- Комментарии
COMMENT ON FUNCTION get_task_history_user_id() IS 'Получает user_id из контекста сессии для записи в историю';
COMMENT ON FUNCTION serialize_field_value_text(TEXT) IS 'Сериализует текстовое значение для записи в историю';
COMMENT ON FUNCTION serialize_field_value_integer(INTEGER) IS 'Сериализует целочисленное значение для записи в историю';
COMMENT ON FUNCTION serialize_field_value_bigint(BIGINT) IS 'Сериализует значение BIGINT для записи в историю';
COMMENT ON FUNCTION serialize_field_value_date(DATE) IS 'Сериализует дату для записи в историю';
COMMENT ON FUNCTION log_task_creation() IS 'Логирует создание задачи в историю';
COMMENT ON FUNCTION log_task_update() IS 'Логирует обновление задачи в историю';
COMMENT ON FUNCTION log_task_deletion() IS 'Логирует удаление задачи в историю';

