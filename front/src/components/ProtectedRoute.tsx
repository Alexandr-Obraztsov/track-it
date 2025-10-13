import { AuthGuard } from './AuthGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <AuthGuard>{children}</AuthGuard>;
};
