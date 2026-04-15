// frontend/src/components/Auth/ProtectedRoute.tsx
// REFACTORED: Default redirect is now '/' (unified login on landing page)

import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import { LoadingSpinner } from '../Shared/UI/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullPage />;

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const employeeDashboards: Partial<Record<UserRole, string>> = {
      admin: '/admin',
      designer: '/designer',
      cashier: '/cashier',
      production: '/production',
    };
    const ownDashboard = employeeDashboards[user.role];
    if (ownDashboard) return <Navigate to={ownDashboard} replace />;
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};