import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Box, Typography, Card, CardContent, Stack } from '@mui/material';
import { Layout } from './Layout';
import type { NavigationTab } from '../../organisms/BottomNavigation';

const meta: Meta<typeof Layout> = {
  title: 'Templates/Layout',
  component: Layout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onTabChange: { action: 'tab changed' },
  },
};

export default meta;
type Story = StoryObj<typeof Layout>;

const ShortContent = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Короткий контент
    </Typography>
    <Card>
      <CardContent>
        <Typography>
          Это пример короткого контента, который помещается на экране без прокрутки.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);

const LongContent = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Длинный контент
    </Typography>
    <Stack spacing={2}>
      {Array.from({ length: 20 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Элемент {index + 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Это элемент списка с длинным контентом, который требует прокрутки для просмотра всех элементов.
              Контент должен корректно отображаться с учетом нижней навигации.
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  </Box>
);

const VeryLongContent = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Очень длинный контент
    </Typography>
    <Stack spacing={2}>
      {Array.from({ length: 50 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Элемент {index + 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Это элемент списка с очень длинным контентом. Такое количество элементов требует значительной прокрутки.
              Проверяем, что нижняя навигация всегда остается видимой и доступной.
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  </Box>
);

export const WithShortContent: Story = {
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<NavigationTab>('groups');
    return (
      <Layout
        {...args}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      >
        <ShortContent />
      </Layout>
    );
  },
};

export const WithLongContent: Story = {
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<NavigationTab>('board');
    return (
      <Layout
        {...args}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      >
        <LongContent />
      </Layout>
    );
  },
};

export const WithVeryLongContent: Story = {
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<NavigationTab>('profile');
    return (
      <Layout
        {...args}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      >
        <VeryLongContent />
      </Layout>
    );
  },
};

export const WithoutBottomNavigation: Story = {
  render: (args) => (
    <Layout
      {...args}
      showBottomNavigation={false}
    >
      <ShortContent />
    </Layout>
  ),
};

export const DifferentTabs: Story = {
  render: (args) => {
    const [currentTab, setCurrentTab] = useState<NavigationTab>('groups');
    return (
      <Layout
        {...args}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Текущая вкладка: {currentTab}
          </Typography>
          <Card>
            <CardContent>
              <Typography>
                Переключайтесь между вкладками, чтобы увидеть изменение заголовка и активной вкладки.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Layout>
    );
  },
};

