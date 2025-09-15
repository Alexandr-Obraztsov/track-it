# Схема базы данных Track-It

## Диаграмма связей (ERD)

```mermaid
erDiagram
    CHATS {
        int id PK
        bigint chatId UK "Telegram Chat ID"
        varchar title "Название беседы"
        varchar username "Username беседы"
        bigint welcomeMessageId "ID приветственного сообщения"
        bigint warningMessageId "ID предупреждения"
    }

    CHAT_MEMBERS {
        int id PK
        varchar chatId FK "Ссылка на chats.chatId"
        bigint userId "Telegram User ID"
        varchar username "Username пользователя"
        varchar firstName "Имя"
        varchar lastName "Фамилия"
        timestamp joinedAt "Дата присоединения"
        int roleId FK "Ссылка на roles.id"
    }

    ROLES {
        int id PK
        varchar name "Название роли"
        varchar chatId FK "Ссылка на chats.chatId"
        timestamp createdAt "Дата создания"
    }

    TASKS {
        int id PK
        varchar title "Название задачи"
        text description "Описание"
        varchar readableId "Читаемый ID (CHT-123)"
        enum priority "high|medium|low"
        varchar deadline "Срок выполнения"
        timestamp createdAt "Дата создания"
        enum type "personal|group"
        bigint userId "Для личных задач"
        bigint authorUserId "Автор задачи"
        varchar chatId FK "Ссылка на chats.chatId"
        bigint assignedToUserId "Назначено пользователю"
        int assignedToRoleId FK "Назначено роли"
        boolean isCompleted "Статус выполнения"
    }

    %% Связи один-ко-многим
    CHATS ||--o{ CHAT_MEMBERS : "имеет участников"
    CHATS ||--o{ ROLES : "имеет роли"
    CHATS ||--o{ TASKS : "содержит задачи"
    
    %% Связи для ролей
    ROLES ||--o{ CHAT_MEMBERS : "назначена участникам"
    ROLES ||--o{ TASKS : "назначены задачи"

    %% Связи для задач (через составные ключи)
    CHAT_MEMBERS ||--o{ TASKS : "автор задачи (authorUserId + chatId)"
    CHAT_MEMBERS ||--o{ TASKS : "назначена задача (assignedToUserId + chatId)"
```

## Ключевые особенности схемы

### 1. **Иерархия чатов**
- `CHATS` - центральная таблица, содержащая информацию о Telegram беседах
- Каждый чат имеет уникальный `chatId` (из Telegram API)

### 2. **Участники чатов**
- `CHAT_MEMBERS` - участники беседы с их ролями
- Связь с чатом через `chatId`
- Опциональная связь с ролью через `roleId`

### 3. **Система ролей**
- `ROLES` - роли внутри каждого чата
- Каждая роль принадлежит конкретному чату
- Участники могут иметь роли (один участник = одна роль)

### 4. **Задачи с гибким назначением**
- `TASKS` - задачи с поддержкой личных и групповых типов
- **Автор задачи**: связь через составной ключ (`authorUserId` + `chatId`)
- **Назначение**: может быть назначена либо пользователю, либо роли
  - Пользователю: через составной ключ (`assignedToUserId` + `chatId`)
  - Роли: через простой FK (`assignedToRoleId`)

## Примеры запросов

### Получить все задачи чата с авторами и назначениями:
```sql
SELECT 
    t.*,
    author.firstName as author_name,
    assignee.firstName as assignee_name,
    r.name as assigned_role
FROM tasks t
LEFT JOIN chat_members author ON (t.authorUserId = author.userId AND t.chatId = author.chatId)
LEFT JOIN chat_members assignee ON (t.assignedToUserId = assignee.userId AND t.chatId = assignee.chatId)
LEFT JOIN roles r ON t.assignedToRoleId = r.id
WHERE t.chatId = 'some_chat_id';
```

### Получить все задачи, назначенные участнику (напрямую или через роль):
```sql
SELECT DISTINCT t.*
FROM tasks t
LEFT JOIN chat_members cm ON (t.assignedToUserId = cm.userId AND t.chatId = cm.chatId)
LEFT JOIN chat_members cm_role ON (t.chatId = cm_role.chatId AND t.assignedToRoleId = cm_role.roleId)
WHERE (cm.userId = 'target_user_id' OR cm_role.userId = 'target_user_id')
  AND t.chatId = 'some_chat_id';
```