import type { Meta, StoryObj } from '@storybook/react';
import { TaskCard } from './TaskCard';

const meta: Meta<typeof TaskCard> = {
  title: 'Organisms/TaskCard',
  component: TaskCard,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['backlog', 'in_progress', 'completed'],
    },
    onStatusChange: { action: 'status changed' },
    onEdit: { action: 'edit clicked' },
    onComment: { action: 'comment clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskCard>;

export const Default: Story = {
  args: {
    id: 1,
    title: 'Создать API для задач',
    description: 'Реализовать REST API endpoints для управления задачами',
    status: 'backlog',
  },
};

export const InProgress: Story = {
  args: {
    id: 2,
    title: 'Настроить базу данных',
    description: 'Создать миграции и настроить TypeORM',
    status: 'in_progress',
    assignedUser: {
      id: 1,
      firstName: 'Иван',
      lastName: 'Петров',
      username: 'ivan_petrov',
    },
  },
};

export const Completed: Story = {
  args: {
    id: 3,
    title: 'Добавить авторизацию',
    description: 'Реализовать JWT авторизацию через Telegram',
    status: 'completed',
    assignedUser: {
      id: 2,
      firstName: 'Мария',
      lastName: 'Сидорова',
    },
  },
};

export const WithDeadline: Story = {
  args: {
    id: 4,
    title: 'Завершить проект',
    description: 'Финальная проверка и деплой',
    status: 'in_progress',
    assignedUser: {
      id: 1,
      firstName: 'Иван',
      lastName: 'Петров',
    },
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const Overdue: Story = {
  args: {
    id: 5,
    title: 'Просроченная задача',
    description: 'Эта задача уже просрочена',
    status: 'in_progress',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
};
