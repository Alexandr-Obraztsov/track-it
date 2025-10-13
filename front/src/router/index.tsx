import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { ChatsPage } from '../pages/ChatsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/',
        element: <ProtectedRoute><Outlet /></ProtectedRoute>,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'tasks',
            element: <TasksPage />,
          },
          {
            path: 'chats',
            element: <ChatsPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
