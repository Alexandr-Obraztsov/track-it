import type { Meta, StoryObj } from '@storybook/react';
import { AssignUserDialog } from './AssignUserDialog';
import { useState } from 'react';

const meta: Meta<typeof AssignUserDialog> = {
  title: 'Organisms/AssignUserDialog',
  component: AssignUserDialog,
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof AssignUserDialog>;

const AssignUserDialogWrapper = (args: any) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <AssignUserDialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(userId) => {
          console.log('Selected user ID:', userId);
          setOpen(false);
        }}
      />
    </>
  );
};

export const Default: Story = {
  render: (args) => <AssignUserDialogWrapper {...args} />,
  args: {
    users: [
      { id: 1, firstName: 'Иван', lastName: 'Петров', username: 'ivan_petrov', telegramId: 123456789, createdAt: new Date().toISOString() },
      { id: 2, firstName: 'Мария', lastName: 'Сидорова', username: 'maria_sidorova', telegramId: 987654321, createdAt: new Date().toISOString() },
      { id: 3, firstName: 'Алексей', lastName: 'Иванов', telegramId: 456789123, createdAt: new Date().toISOString() },
    ],
  },
};

export const WithTaskTitle: Story = {
  render: (args) => <AssignUserDialogWrapper {...args} />,
  args: {
    taskTitle: 'Создать REST API для обработки задач',
    users: [
      { id: 1, firstName: 'Иван', lastName: 'Петров', username: 'ivan_petrov', telegramId: 123456789, createdAt: new Date().toISOString() },
      { id: 2, firstName: 'Мария', lastName: 'Сидорова', username: 'maria_sidorova', telegramId: 987654321, createdAt: new Date().toISOString() },
      { id: 3, firstName: 'Алексей', lastName: 'Иванов', telegramId: 456789123, createdAt: new Date().toISOString() },
    ],
  },
};

export const ManyUsers: Story = {
  render: (args) => <AssignUserDialogWrapper {...args} />,
  args: {
    taskTitle: 'Реализовать систему уведомлений',
    users: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      firstName: `Пользователь${i + 1}`,
      lastName: `Фамилия${i + 1}`,
      username: `user${i + 1}`,
      telegramId: 100000000 + i,
      createdAt: new Date().toISOString(),
    })),
  },
};


