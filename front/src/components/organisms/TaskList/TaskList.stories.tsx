import type { Meta, StoryObj } from '@storybook/react';
import { TaskList } from './TaskList';

const meta: Meta<typeof TaskList> = {
  title: 'Organisms/TaskList',
  component: TaskList,
  tags: ['autodocs'],
  argTypes: {
    onStatusChange: { action: 'status changed' },
    onEdit: { action: 'edit clicked' },
    onComment: { action: 'comment clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskList>;

const mockTasks = [
  {
    id: 1,
    title: 'Создать API для задач',
    description: 'Реализовать REST API endpoints',
    status: 'backlog' as const,
  },
  {
    id: 2,
    title: 'Настроить базу данных',
    description: 'Создать миграции и настроить TypeORM',
    status: 'in_progress' as const,
    assignedUser: {
      id: 1,
      firstName: 'Иван',
      lastName: 'Петров',
      username: 'ivan_petrov',
    },
  },
  {
    id: 3,
    title: 'Добавить авторизацию',
    description: 'Реализовать JWT авторизацию',
    status: 'completed' as const,
    assignedUser: {
      id: 2,
      firstName: 'Мария',
      lastName: 'Сидорова',
    },
  },
  {
    id: 4,
    title: 'Написать тесты',
    status: 'backlog' as const,
  },
  {
    id: 5,
    title: 'Оптимизировать производительность',
    description: 'Провести профилирование и оптимизацию',
    status: 'in_progress' as const,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const Default: Story = {
  args: {
    tasks: mockTasks,
  },
};

export const Empty: Story = {
  args: {
    tasks: [],
  },
};

export const OnlyBacklog: Story = {
  args: {
    tasks: mockTasks.filter((t) => t.status === 'backlog'),
  },
};
