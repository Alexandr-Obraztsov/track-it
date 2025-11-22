import type { Meta, StoryObj } from '@storybook/react';
import { DeadlineChip } from './DeadlineChip';

const meta: Meta<typeof DeadlineChip> = {
  title: 'Molecules/DeadlineChip',
  component: DeadlineChip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DeadlineChip>;

export const Upcoming: Story = {
  args: {
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const Overdue: Story = {
  args: {
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

