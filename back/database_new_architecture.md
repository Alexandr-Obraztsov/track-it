# Новая архитектура базы данных Track-It

## Обзор изменений

Полностью переработана архитектура базы данных с упрощением схемы и объединением функционала.

## Таблицы

### 1. `users` - Пользователи Telegram
```sql
CREATE TABLE users (
    telegramId BIGINT PRIMARY KEY,           -- ID пользователя в Telegram
    username VARCHAR(255),                   -- Username пользователя
    firstName VARCHAR(255),                  -- Имя пользователя
    lastName VARCHAR(255),                   -- Фамилия пользователя
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. `chats` - Чаты Telegram
```sql
CREATE TABLE chats (
    telegramId BIGINT PRIMARY KEY,           -- ID чата в Telegram
    title VARCHAR(255) NOT NULL,             -- Название чата
    username VARCHAR(255),                   -- Username чата
    welcomeMessageId BIGINT,                 -- ID приветственного сообщения
    warningMessageId BIGINT,                 -- ID сообщения с предупреждением
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. `roles` - Роли в чатах
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,              -- Название роли
    chatId BIGINT NOT NULL,                  -- FK to chats.telegramId
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chatId) REFERENCES chats(telegramId) ON DELETE CASCADE,
    UNIQUE KEY unique_role_per_chat (chatId, name)
);
```

### 4. `chat_members` - Участники чатов (связующая таблица)
```sql
CREATE TABLE chat_members (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    chatId BIGINT NOT NULL,                  -- FK to chats.telegramId
    userId BIGINT NOT NULL,                  -- FK to users.telegramId
    roleId INTEGER,                          -- FK to roles.id (nullable)
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chatId) REFERENCES chats(telegramId) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(telegramId) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_per_chat (chatId, userId)
);
```

### 5. `tasks` - Объединенные задачи (личные + групповые)
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,             -- Название задачи
    description TEXT NOT NULL,               -- Описание задачи
    readableId VARCHAR(255) NOT NULL,        -- Читаемый ID (PSN-123, CHT-456)
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    deadline DATE,                           -- Срок выполнения
    isCompleted BOOLEAN DEFAULT FALSE,       -- Статус выполнения
    type ENUM('personal', 'group') DEFAULT 'personal',
    authorId BIGINT NOT NULL,                -- FK to users.telegramId
    chatId BIGINT,                          -- FK to chats.telegramId (для групповых)
    assignedUserId BIGINT,                  -- FK to users.telegramId (назначение)
    assignedRoleId INTEGER,                 -- FK to roles.id (назначение)
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (authorId) REFERENCES users(telegramId) ON DELETE CASCADE,
    FOREIGN KEY (chatId) REFERENCES chats(telegramId) ON DELETE CASCADE,
    FOREIGN KEY (assignedUserId) REFERENCES users(telegramId) ON DELETE SET NULL,
    FOREIGN KEY (assignedRoleId) REFERENCES roles(id) ON DELETE SET NULL,
    
    INDEX idx_author (authorId),
    INDEX idx_chat (chatId),
    INDEX idx_assigned_user (assignedUserId),
    INDEX idx_assigned_role (assignedRoleId),
    INDEX idx_type (type),
    INDEX idx_completed (isCompleted)
);
```

## Схема связей

```
users (1) ←→ (N) chat_members (N) ←→ (1) chats
  ↓                                      ↓
  (1)                                    (1)
  ↓                                      ↓
tasks (N)                           roles (N)
  ↓                                      ↓
  (N) ←→ (1) assignedUser           (N) ←→ (1)
  (N) ←→ (1) assignedRole
```

## Ключевые особенности новой архитектуры

### 1. **Упрощенная схема**
- Telegram ID как первичные ключи для users и chats
- Убраны избыточные поля (дублирование данных пользователей в chat_members)
- Четкое разделение ответственности между таблицами

### 2. **Объединенные задачи**
- Одна таблица для личных и групповых задач
- Тип задачи определяется полем `type` и наличием `chatId`
- Гибкое назначение: либо пользователю, либо роли

### 3. **Правильные связи**
- Каскадное удаление для критических связей
- SET NULL для необязательных связей
- Уникальные ограничения для предотвращения дублирования

### 4. **Производительность**
- Оптимальные индексы для частых запросов
- Минимум JOIN-ов для большинства операций
- Эффективные foreign key constraints

## API сервисов

### UserService
```typescript
// CRUD операции для пользователей
createOrGetUser(data: CreateUserDto): Promise<UserEntity>
getUserById(telegramId: string): Promise<UserEntity | null>
updateUser(telegramId: string, data: UpdateUserDto): Promise<UserEntity | null>
deleteUser(telegramId: string): Promise<boolean>

// Дополнительные методы
getUserChats(telegramId: string): Promise<ChatMemberEntity[]>
getUserStats(telegramId: string): Promise<UserStats>
searchUsers(query: string): Promise<UserEntity[]>
```

### ChatService
```typescript
// CRUD операции для чатов
createOrGetChat(data: CreateChatDto): Promise<ChatEntity>
getChatById(telegramId: string): Promise<ChatEntity | null>
updateChat(telegramId: string, data: UpdateChatDto): Promise<ChatEntity | null>
deleteChat(telegramId: string): Promise<boolean>

// Управление участниками
addMember(chatId: string, userId: string, roleId?: number): Promise<ChatMemberEntity>
removeMember(chatId: string, userId: string): Promise<boolean>
assignRole(chatId: string, userId: string, roleId: number): Promise<ChatMemberEntity | null>
```

### RoleService
```typescript
// CRUD операции для ролей
createRole(data: CreateRoleDto): Promise<RoleEntity>
getRoleById(id: number): Promise<RoleEntity | null>
updateRole(id: number, data: UpdateRoleDto): Promise<RoleEntity | null>
deleteRole(id: number): Promise<boolean>

// Управление участниками ролей
assignRoleToMember(chatId: string, userId: string, roleId: number): Promise<boolean>
removeRoleFromMember(chatId: string, userId: string): Promise<boolean>
```

### TaskService (объединенный)
```typescript
// CRUD операции для всех задач
createTask(data: CreateTaskDto): Promise<TaskEntity>
getTaskById(id: number): Promise<TaskEntity | null>
updateTask(id: number, data: UpdateTaskDto): Promise<TaskEntity | null>
deleteTask(id: number): Promise<boolean>

// Специфичные методы
getPersonalTasks(userId: string): Promise<TaskEntity[]>
getGroupTasks(chatId: string): Promise<TaskEntity[]>
getAssignedTasks(userId: string, chatId?: string): Promise<TaskEntity[]>
getTasksByRole(roleId: number): Promise<TaskEntity[]>

// Назначение задач
assignToUser(taskId: number, userId: string): Promise<TaskEntity | null>
assignToRole(taskId: number, roleId: number): Promise<TaskEntity | null>
unassignTask(taskId: number): Promise<TaskEntity | null>
```

## Преимущества новой архитектуры

1. **Простота**: Меньше таблиц, понятные связи
2. **Производительность**: Оптимальные индексы, минимум JOIN-ов
3. **Масштабируемость**: Легко добавлять новые функции
4. **Типобезопасность**: Четкие TypeScript интерфейсы
5. **Гибкость**: Универсальная система назначения задач
6. **Целостность**: Правильные constraints и каскадные операции