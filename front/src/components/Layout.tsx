import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';
import { Home, MessageSquare, CheckSquare, User } from 'lucide-react';
import { useEffect } from 'react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Дашборд' },
    { path: '/chats', icon: MessageSquare, label: 'Чаты' },
    { path: '/tasks', icon: CheckSquare, label: 'Задачи' },
    { path: '/profile', icon: User, label: 'Профиль' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Основной контент */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-inset-bottom">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

