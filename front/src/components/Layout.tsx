import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { clearUser } from '../store/slices/authSlice';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  CheckSquare, 
  MessageSquare, 
  User, 
  LogOut,
  MoreVertical
} from 'lucide-react';
import { useState } from 'react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    dispatch(clearUser());
    navigate('/login');
    setShowUserMenu(false);
  };

  const navigationItems = [
    { path: '/', label: 'Главная', icon: LayoutDashboard },
    { path: '/tasks', label: 'Задачи', icon: CheckSquare },
    { path: '/chats', label: 'Чаты', icon: MessageSquare },
    { path: '/profile', label: 'Профиль', icon: User },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold text-gray-900">Track It</h1>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2"
            >
              {user?.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <MoreVertical className="w-5 h-5" />
              )}
            </Button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                <div className="p-3 border-b">
                  <p className="font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  {user?.username && (
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Overlay for user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};
