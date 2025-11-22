import type { Meta, StoryObj } from '@storybook/react';
import { TaskActions } from './TaskActions';

const meta: Meta<typeof TaskActions> = {
  title: 'Molecules/TaskActions',
  component: TaskActions,
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit clicked' },
    onComment: { action: 'comment clicked' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TaskActions>;

export const AllActions: Story = {
  args: {
    onEdit: () => {},
    onComment: () => {},
    onDelete: () => {},
  },
};

export const EditAndComment: Story = {
  args: {
    onEdit: () => {},
    onComment: () => {},
  },
};

export const EditOnly: Story = {
  args: {
    onEdit: () => {},
  },
};

export const CommentOnly: Story = {
  args: {
    onComment: () => {},
  },
};

export const DeleteOnly: Story = {
  args: {
    onDelete: () => {},
  },
};

