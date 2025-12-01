import type { Meta, StoryObj } from '@storybook/react';
import { Profile } from './Profile';
import { mockCurrentUser, mockNotificationSettings } from '../../../mocks/data';

const meta: Meta<typeof Profile> = {
  title: 'Templates/Profile',
  component: Profile,
  tags: ['autodocs'],
  argTypes: {
    onSaveNotifications: { action: 'notifications saved' },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Profile>;

export const Default: Story = {
  args: {
    user: mockCurrentUser,
    notificationSettings: mockNotificationSettings,
  },
};

export const AllNotificationsOn: Story = {
  args: {
    user: mockCurrentUser,
    notificationSettings: {
      dailyDigestTime: '09:00',
      deadlineReminderHours: [168, 72, 24, 12, 1],
    },
  },
};

export const AllNotificationsOff: Story = {
  args: {
    user: mockCurrentUser,
    notificationSettings: {
      dailyDigestTime: '09:00',
      deadlineReminderHours: [],
    },
  },
};

export const UserWithoutPhoto: Story = {
  args: {
    user: {
      ...mockCurrentUser,
      photoUrl: null,
    },
    notificationSettings: mockNotificationSettings,
  },
};

export const UserWithoutUsername: Story = {
  args: {
    user: {
      ...mockCurrentUser,
      username: null,
    },
    notificationSettings: mockNotificationSettings,
  },
};

export const UserWithoutLastName: Story = {
  args: {
    user: {
      ...mockCurrentUser,
      lastName: null,
    },
    notificationSettings: mockNotificationSettings,
  },
};

export const Loading: Story = {
  args: {
    user: mockCurrentUser,
    notificationSettings: mockNotificationSettings,
    loading: true,
  },
};

