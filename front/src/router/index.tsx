import LoginPage from '@/pages/LoginPage';
import Layout from '@/components/Layout';
import ChatsPage from '@/pages/ChatsPage';
import TasksPage from '@/pages/TasksPage';
import TaskEditPage from '@/pages/TaskEditPage';
import ProfilePage from '@/pages/ProfilePage';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/tasks" replace />,
      },
      {
        path: 'chats',
        element: <ChatsPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'tasks/:id',
        element: <TaskEditPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
]);