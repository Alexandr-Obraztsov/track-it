import type { Meta, StoryObj } from '@storybook/react';
import { TaskForm } from './TaskForm';
import { useState } from 'react';

const meta: Meta<typeof TaskForm> = {
  title: 'Organisms/TaskForm',
  component: TaskForm,
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskForm>;

const TaskFormWrapper = (args: any) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Form</button>
      <TaskForm
        {...args}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export const CreateTask: Story = {
  render: (args) => <TaskFormWrapper {...args} />,
  args: {
    assignedUsers: [
      { id: 1, firstName: 'Иван', lastName: 'Петров', username: 'ivan_petrov' },
      { id: 2, firstName: 'Мария', lastName: 'Сидорова', username: 'maria_sidorova' },
      { id: 3, firstName: 'Алексей', lastName: 'Иванов' },
    ],
  },
};

export const EditTask: Story = {
  render: (args) => <TaskFormWrapper {...args} />,
  args: {
    initialData: {
      title: 'Существующая задача',
      description: 'Описание существующей задачи',
      assignedUserId: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    assignedUsers: [
      { id: 1, firstName: 'Иван', lastName: 'Петров', username: 'ivan_petrov' },
      { id: 2, firstName: 'Мария', lastName: 'Сидорова', username: 'maria_sidorova' },
    ],
  },
};
