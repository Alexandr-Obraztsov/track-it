import type { Meta, StoryObj } from '@storybook/react';
import { GroupSelection } from './GroupSelection';
import { mockChats } from '../../../mocks/data';

const meta: Meta<typeof GroupSelection> = {
  title: 'Templates/GroupSelection',
  component: GroupSelection,
  tags: ['autodocs'],
  argTypes: {
    onSelectChat: { action: 'chat selected' },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupSelection>;

export const Default: Story = {
  args: {
    chats: mockChats,
    currentChatId: null,
  },
};

export const WithSelectedChat: Story = {
  args: {
    chats: mockChats,
    currentChatId: mockChats[0].id,
  },
};

export const Empty: Story = {
  args: {
    chats: [],
    currentChatId: null,
  },
};

export const Loading: Story = {
  args: {
    chats: [],
    currentChatId: null,
    loading: true,
  },
};

export const ManyChats: Story = {
  args: {
    chats: [
      ...mockChats,
      {
        id: -1001112223330,
        title: 'Дополнительная группа разработки',
        messageId: 999,
        createdAt: '2024-01-25T10:00:00Z',
        tasks: [],
        userChatRoles: [],
        chatRoles: [],
      },
      {
        id: -1004445556660,
        title: 'Тестирование и QA',
        messageId: 888,
        createdAt: '2024-01-26T11:00:00Z',
        tasks: [],
        userChatRoles: [],
        chatRoles: [],
      },
    ],
    currentChatId: null,
  },
};

