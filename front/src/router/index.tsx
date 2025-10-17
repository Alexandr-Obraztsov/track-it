import LoginPage from '@/pages/LoginPage';
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    index: true,
    element: <LoginPage />,
  }
]);