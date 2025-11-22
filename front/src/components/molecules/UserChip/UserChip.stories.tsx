import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { UserChip } from './UserChip';

const meta: Meta<typeof UserChip> = {
  title: 'Molecules/UserChip',
  component: UserChip,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
    maxLength: {
      control: 'number',
      description: 'Максимальная длина имени перед обрезкой',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserChip>;

export const Default: Story = {
  args: {
    firstName: 'Иван',
    lastName: 'Петров',
  },
};

export const WithoutLastName: Story = {
  args: {
    firstName: 'Мария',
    lastName: null,
  },
};

export const LongName: Story = {
  args: {
    firstName: 'Александр',
    lastName: 'Сергеевич',
  },
};

export const VeryLongName: Story = {
  args: {
    firstName: 'Александр',
    lastName: 'Сергеевич Пушкин',
    maxLength: 15,
  },
};

export const ExtremelyLongName: Story = {
  args: {
    firstName: 'Александр',
    lastName: 'Сергеевич Пушкин Великий',
    maxLength: 20,
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <UserChip firstName="Иван" lastName="Петров" size="small" />
      <UserChip firstName="Мария" lastName="Сидорова" size="medium" />
    </Stack>
  ),
};

export const DifferentNames: Story = {
  render: () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
      <UserChip firstName="Иван" lastName="Петров" />
      <UserChip firstName="Мария" lastName="Сидорова" />
      <UserChip firstName="Алексей" />
      <UserChip firstName="Екатерина" lastName="Великая" />
      <UserChip firstName="Александр" lastName="Сергеевич Пушкин" maxLength={15} />
    </Stack>
  ),
};
