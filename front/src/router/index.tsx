import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/templates/Layout';
import { GroupsPage } from '../pages/GroupsPage';
import { TaskBoardPage } from '../pages/TaskBoardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES, getBoardRoute } from '../constants/routes';
import type { NavigationTab } from '../components/organisms/BottomNavigation';

// Компонент для защиты маршрутов
const ProtectedRoute = () => {
  const initData = localStorage.getItem('telegram_init_data');
  if (!initData) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
};

// Компонент для определения текущего таба на основе пути
const LayoutWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getCurrentTab = (): NavigationTab => {
    if (location.pathname.startsWith(ROUTES.BOARD)) {
      return 'board';
    }
    if (location.pathname === ROUTES.PROFILE) {
      return 'profile';
    }
    return 'groups';
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (tab: NavigationTab) => {
    if (tab === 'groups') {
      navigate(ROUTES.GROUPS);
    } else if (tab === 'board') {
      // Если уже на доске, не переходим, иначе переходим на первую доступную доску
      if (!location.pathname.startsWith(ROUTES.BOARD)) {
        navigate(getBoardRoute(1));
      }
    } else if (tab === 'profile') {
      navigate(ROUTES.PROFILE);
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={handleTabChange}>
      <Outlet />
    </Layout>
  );
};

export const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <LayoutWrapper />,
        children: [
          {
            path: ROUTES.GROUPS,
            element: <GroupsPage />,
          },
          {
            path: `${ROUTES.BOARD}/:chatId`,
            element: <TaskBoardPage />,
          },
          {
            path: ROUTES.PROFILE,
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.LOGIN} replace />,
  },
]);



