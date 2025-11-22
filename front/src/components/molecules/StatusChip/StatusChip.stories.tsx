import type { Meta, StoryObj } from '@storybook/react';
import { StatusChip } from './StatusChip';

const meta: Meta<typeof StatusChip> = {
  title: 'Molecules/StatusChip',
  component: StatusChip,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['backlog', 'in_progress', 'completed'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusChip>;

export const Backlog: Story = {
  args: {
    status: 'backlog',
  },
};

export const InProgress: Story = {
  args: {
    status: 'in_progress',
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
  },
};

