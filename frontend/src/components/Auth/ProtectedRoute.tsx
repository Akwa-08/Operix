// frontend/src/components/Auth/ProtectedRoute.tsx
 
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
 
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /**
   * Where to go if access is denied.
   * Use '/' for customer pages, '/staff-login' for employee pages.
   */
  redirectTo?: string;
}
 
export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
 
  // Show spinner while auth state loads — prevents flash redirect
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12
                       border-b-2 border-blue-600' />
      </div>
    );
  }
 
  // Not logged in
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
 
  // Wrong role
  if (!allowedRoles.includes(user.role)) {
    // Employee trying to access wrong portal — redirect to their own dashboard
    const employeeDashboards: Partial<Record<UserRole, string>> = {
      admin: '/admin',
      designer: '/designer',
      cashier: '/cashier',
      production: '/production',
    };
    const ownDashboard = employeeDashboards[user.role];
    if (ownDashboard) return <Navigate to={ownDashboard} replace />;
    // Customer trying employee pages
    return <Navigate to={redirectTo} replace />;
  }
 
  return <>{children}</>;
};

