import type { Meta, StoryObj } from '@storybook/react';
import { TaskBoard } from './TaskBoard';
import { mockChats, mockUsers, mockTasks } from '../../../mocks/data';

const meta: Meta<typeof TaskBoard> = {
  title: 'Templates/TaskBoard',
  component: TaskBoard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onStatusChange: { action: 'status changed' },
    onTaskCreate: { action: 'task created' },
    onTaskEdit: { action: 'task edited' },
    onTaskDelete: { action: 'task deleted' },
    onTaskComment: { action: 'comment clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskBoard>;

const chatWithTasks = mockChats[0];

export const Default: Story = {
  args: {
    chatId: chatWithTasks.id,
    chatTitle: chatWithTasks.title,
    tasks: chatWithTasks.tasks || [],
    assignedUsers: mockUsers,
  },
};

export const Empty: Story = {
  args: {
    chatId: mockChats[1].id,
    chatTitle: mockChats[1].title,
    tasks: [],
    assignedUsers: mockUsers,
  },
};

export const ManyTasks: Story = {
  args: {
    chatId: chatWithTasks.id,
    chatTitle: chatWithTasks.title,
    tasks: [
      ...mockTasks,
      {
        id: 4,
        title: 'Новая задача 1',
        description: 'Описание новой задачи',
        assignedUserId: 1,
        assignedRoleId: null,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'backlog',
        createdAt: new Date().toISOString(),
        assignedUser: mockUsers[0],
      },
      {
        id: 5,
        title: 'Новая задача 2',
        description: null,
        assignedUserId: 2,
        assignedRoleId: null,
        deadline: null,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        assignedUser: mockUsers[1],
      },
      {
        id: 6,
        title: 'Завершенная задача',
        description: 'Уже выполнена',
        assignedUserId: 1,
        assignedRoleId: null,
        deadline: null,
        status: 'completed',
        createdAt: new Date().toISOString(),
        assignedUser: mockUsers[0],
      },
    ],
    assignedUsers: mockUsers,
  },
};

export const Loading: Story = {
  args: {
    chatId: chatWithTasks.id,
    chatTitle: chatWithTasks.title,
    tasks: [],
    assignedUsers: mockUsers,
    loading: true,
  },
};

