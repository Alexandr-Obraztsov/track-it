import type { Meta, StoryObj } from '@storybook/react';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { useState } from 'react';
import type { Task } from '../../../types/api';

const meta: Meta<typeof TaskDetailsDialog> = {
  title: 'Organisms/TaskDetailsDialog',
  component: TaskDetailsDialog,
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
    onComment: { action: 'comment' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskDetailsDialog>;

const TaskDetailsDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <TaskDetailsDialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

const mockTask: Task = {
  id: 1,
  title: 'Создать REST API для обработки задач',
  description: 'Необходимо реализовать полноценный REST API для работы с задачами. API должен поддерживать создание, чтение, обновление и удаление задач. Также нужно добавить фильтрацию по статусу и назначенному пользователю.',
  status: 'in_progress',
  assignedUserId: 1,
  assignedRoleId: null,
  labelId: null,
  assignedUser: {
    id: 1,
    firstName: 'Иван',
    lastName: 'Петров',
    username: 'ivan_petrov',
    telegramId: 123456789,
    photoUrl: null,
    createdAt: new Date().toISOString(),
  },
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

export const Default: Story = {
  render: (args) => <TaskDetailsDialogWrapper {...args} />,
  args: {
    task: mockTask,
  },
};

export const BacklogTask: Story = {
  render: (args) => <TaskDetailsDialogWrapper {...args} />,
  args: {
    task: {
      ...mockTask,
      id: 2,
      title: 'Обновить дизайн интерфейса',
      status: 'backlog',
      assignedUserId: null,
      assignedUser: null,
      deadline: null,
    },
  },
};

export const CompletedTask: Story = {
  render: (args) => <TaskDetailsDialogWrapper {...args} />,
  args: {
    task: {
      ...mockTask,
      id: 3,
      title: 'Написать документацию',
      status: 'completed',
      assignedUserId: 2,
      assignedUser: {
        id: 2,
        firstName: 'Мария',
        lastName: 'Сидорова',
        username: 'maria_sidorova',
        telegramId: 987654321,
        photoUrl: null,
        createdAt: new Date().toISOString(),
      },
    },
  },
};

export const TaskWithoutDescription: Story = {
  render: (args) => <TaskDetailsDialogWrapper {...args} />,
  args: {
    task: {
      ...mockTask,
      id: 4,
      title: 'Простая задача',
      description: null,
    },
  },
};

export const TaskWithoutDeadline: Story = {
  render: (args) => <TaskDetailsDialogWrapper {...args} />,
  args: {
    task: {
      ...mockTask,
      id: 5,
      title: 'Задача без дедлайна',
      deadline: null,
    },
  },
};


