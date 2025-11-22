import type { Chat, User, Task, Role, NotificationSettings } from '../types/api';

export const mockUsers: User[] = [
  {
    id: 1,
    telegramId: 123456789,
    username: 'ivan_petrov',
    firstName: 'Иван',
    lastName: 'Петров',
    photoUrl: null,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    telegramId: 987654321,
    username: 'maria_sidorova',
    firstName: 'Мария',
    lastName: 'Сидорова',
    photoUrl: null,
    createdAt: '2024-01-16T11:00:00Z',
  },
  {
    id: 3,
    telegramId: 555666777,
    username: 'alex_ivanov',
    firstName: 'Алексей',
    lastName: 'Иванов',
    photoUrl: null,
    createdAt: '2024-01-17T12:00:00Z',
  },
];

export const mockRoles: Role[] = [
  {
    id: 1,
    title: 'Разработчик',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 2,
    title: 'Дизайнер',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 3,
    title: 'Менеджер',
    createdAt: '2024-01-10T10:00:00Z',
  },
];

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Создать API для задач',
    description: 'Реализовать REST API endpoints для управления задачами',
    assignedUserId: 1,
    assignedRoleId: null,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    createdAt: '2024-01-20T10:00:00Z',
    assignedUser: mockUsers[0],
  },
  {
    id: 2,
    title: 'Настроить базу данных',
    description: 'Создать миграции и настроить TypeORM',
    assignedUserId: 2,
    assignedRoleId: null,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'backlog',
    createdAt: '2024-01-21T11:00:00Z',
    assignedUser: mockUsers[1],
  },
  {
    id: 3,
    title: 'Добавить авторизацию',
    description: 'Реализовать JWT авторизацию через Telegram',
    assignedUserId: 1,
    assignedRoleId: null,
    deadline: null,
    status: 'completed',
    createdAt: '2024-01-18T09:00:00Z',
    assignedUser: mockUsers[0],
  },
];

export const mockChats: Chat[] = [
  {
    id: -1001234567890,
    title: 'Команда разработки',
    messageId: 123,
    createdAt: '2024-01-10T10:00:00Z',
    tasks: mockTasks,
    userChatRoles: [
      {
        id: 1,
        userId: 1,
        chatId: -1001234567890,
        roleId: 1,
        createdAt: '2024-01-10T10:00:00Z',
        user: mockUsers[0],
        role: mockRoles[0],
      },
      {
        id: 2,
        userId: 2,
        chatId: -1001234567890,
        roleId: 2,
        createdAt: '2024-01-10T10:00:00Z',
        user: mockUsers[1],
        role: mockRoles[1],
      },
    ],
    chatRoles: [
      {
        id: 1,
        chatId: -1001234567890,
        roleId: 1,
        createdAt: '2024-01-10T10:00:00Z',
        role: mockRoles[0],
      },
      {
        id: 2,
        chatId: -1001234567890,
        roleId: 2,
        createdAt: '2024-01-10T10:00:00Z',
        role: mockRoles[1],
      },
    ],
  },
  {
    id: -1009876543210,
    title: 'Маркетинг и продвижение',
    messageId: 456,
    createdAt: '2024-01-12T14:00:00Z',
    tasks: [],
    userChatRoles: [
      {
        id: 3,
        userId: 2,
        chatId: -1009876543210,
        roleId: 3,
        createdAt: '2024-01-12T14:00:00Z',
        user: mockUsers[1],
        role: mockRoles[2],
      },
    ],
    chatRoles: [
      {
        id: 3,
        chatId: -1009876543210,
        roleId: 3,
        createdAt: '2024-01-12T14:00:00Z',
        role: mockRoles[2],
      },
    ],
  },
  {
    id: -1005556667770,
    title: 'Общий чат проекта',
    messageId: 789,
    createdAt: '2024-01-08T08:00:00Z',
    tasks: [mockTasks[2]],
    userChatRoles: [
      {
        id: 4,
        userId: 1,
        chatId: -1005556667770,
        roleId: 1,
        createdAt: '2024-01-08T08:00:00Z',
        user: mockUsers[0],
        role: mockRoles[0],
      },
      {
        id: 5,
        userId: 3,
        chatId: -1005556667770,
        roleId: 1,
        createdAt: '2024-01-08T08:00:00Z',
        user: mockUsers[2],
        role: mockRoles[0],
      },
    ],
    chatRoles: [
      {
        id: 4,
        chatId: -1005556667770,
        roleId: 1,
        createdAt: '2024-01-08T08:00:00Z',
        role: mockRoles[0],
      },
    ],
  },
];

export const mockCurrentUser: User = mockUsers[0];

export const mockNotificationSettings: NotificationSettings = {
  taskAssigned: true,
  taskCompleted: false,
  taskDeadline: true,
  taskComment: true,
  dailyDigest: false,
  weeklyReport: true,
  deadlineReminderHours: 24,
  overdueTasksReminder: true,
  overdueTasksList: true,
  overdueReminderFrequency: 'daily',
  newTaskNotification: true,
  statusChangeNotification: true,
  taskUpdateNotification: true,
};

