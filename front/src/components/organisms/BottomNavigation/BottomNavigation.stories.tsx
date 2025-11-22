import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import type { NavigationTab } from './BottomNavigation';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Organisms/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onChange: { action: 'tab changed' },
  },
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<NavigationTab>('groups');
    return <BottomNavigation {...args} value={value} onChange={setValue} />;
  },
};

export const GroupsTab: Story = {
  render: (args) => {
    const [value, setValue] = useState<NavigationTab>('groups');
    return <BottomNavigation {...args} value={value} onChange={setValue} />;
  },
};

export const BoardTab: Story = {
  render: (args) => {
    const [value, setValue] = useState<NavigationTab>('board');
    return <BottomNavigation {...args} value={value} onChange={setValue} />;
  },
};

export const ProfileTab: Story = {
  render: (args) => {
    const [value, setValue] = useState<NavigationTab>('profile');
    return <BottomNavigation {...args} value={value} onChange={setValue} />;
  },
};



