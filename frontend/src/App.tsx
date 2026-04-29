// frontend/src/App.tsx
// REFACTORED: Removed Redux — all state flows through Supabase hooks + AuthContext
// REFACTORED: All ProtectedRoute redirectTo now point to '/' 
import { lazy, Suspense } from 'react';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AuthLayout = lazy(() => import('./components/Auth/AuthLayout').then(m => ({ default: m.AuthLayout })));

// Customer
const RootLayout = lazy(() => import('./pages/RootLayout').then(m => ({ default: m.RootLayout })));
const CustomerPage = lazy(() => import('./pages/CustomerPage').then(m => ({ default: m.CustomerPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));

// Admin
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'));
const AdminManagement = lazy(() => import('./components/Admin/AdminManagement'));
const AdminOrders = lazy(() => import('./components/Admin/AdminOrders'));
const AdminMessages = lazy(() => import('./components/Admin/AdminMessages'));
const AdminInventory = lazy(() => import('./components/Admin/AdminInventory'));
const AdminPayroll = lazy(() => import('./components/Admin/AdminPayroll'));
const AdminAuditLogs = lazy(() => import('./components/Admin/AdminAuditLogs'));

// Cashier
const CashierPage = lazy(() => import('./pages/CashierPage'));
const CashierDashboard = lazy(() => import('./components/Cashier/CashierDashboard'));
const CashierOrders = lazy(() => import('./components/Cashier/CashierOrders'));
const CashierInventory = lazy(() => import('./components/Cashier/CashierInventory'));

// Designer
const DesignerPage = lazy(() => import('./pages/DesignerPage'));
const DesignerDashboard = lazy(() => import('./components/Designer/DesignerDashboard'));
const DesignerOrders = lazy(() => import('./components/Designer/DesignerOrders'));

// Production
const ProductionPage = lazy(() => import('./pages/ProductionPage'));
const ProductionDashboard = lazy(() => import('./components/Production/ProductionDashboard'));
const ProductionOrders = lazy(() => import('./components/Production/ProductionOrders'));
const ProductionInventory = lazy(() => import('./components/Production/ProductionInventory'));

import { LoadingSpinner } from './components/Shared/UI/LoadingSpinner';

const router = createBrowserRouter([

  // ── PUBLIC ──────────────────────────────────────────────────────────────
  { path: '/',                element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/signup', element: <SignUpPage /> },
      { path: '/login',  element: <LoginPage /> },
    ]
  },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage /> },
  // /staff-login REMOVED — unified LoginModal on landing page handles all roles

  // ── CUSTOMER (role: customer) ────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['customer']} redirectTo='/'><RootLayout /></ProtectedRoute>,
    children: [
      { path: 'customer',  element: <CustomerPage /> },
      { path: 'profile',   element: <ProfilePage /> },
      { path: 'cart',      element: <CartPage /> },
      { path: 'orders',    element: <OrdersPage /> },
      { path: 'messages',  element: <MessagesPage /> },
    ],
  },

  // ── ADMIN (role: admin) ──────────────────────────────────────────────────
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} redirectTo='/'><AdminPage /></ProtectedRoute>,
    children: [
      { index: true,       element: <AdminDashboard /> },
      { path: 'users',     element: <AdminManagement /> },
      { path: 'orders',    element: <AdminOrders /> },
      { path: 'messages',  element: <AdminMessages /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'payroll',   element: <AdminPayroll /> },
      { path: 'profile',   element: <ProfilePage /> },
      { path: 'logs',      element: <AdminAuditLogs /> },
    ],
  },

  // ── CASHIER (role: cashier) ──────────────────────────────────────────────
  {
  path: '/cashier',
  element: <ProtectedRoute allowedRoles={['cashier']} redirectTo='/'><CashierPage /></ProtectedRoute>,
  children: [
    { index: true,       element: <CashierDashboard /> },
    { path: 'orders',    element: <CashierOrders /> },
    { path: 'inventory', element: <CashierInventory /> },
    { path: 'profile',   element: <ProfilePage /> },
    { path: 'messages',  element: <AdminMessages /> },
  ],
},

  // ── DESIGNER (role: designer) ────────────────────────────────────────────
  {
  path: '/designer',
  element: <ProtectedRoute allowedRoles={['designer']} redirectTo='/'><DesignerPage /></ProtectedRoute>,
  children: [
    { index: true,    element: <DesignerDashboard /> },
    { path: 'orders', element: <DesignerOrders /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'messages', element: <AdminMessages /> }, // Designers can use the staff messaging UI
    ],
  },

  // ── PRODUCTION (role: production) ────────────────────────────────────────
  {
    path: '/production',
    element: <ProtectedRoute allowedRoles={['production']} redirectTo='/'><ProductionPage /></ProtectedRoute>,
    children: [
      { index: true,       element: <ProductionDashboard /> },
      { path: 'orders',    element: <ProductionOrders /> },
      { path: 'inventory', element: <ProductionInventory /> },
      { path: 'profile',   element: <ProfilePage /> },
      { path: 'messages',  element: <AdminMessages /> },
    ],
  },

  // ── 404 ─────────────────────────────────────────────────────────────────
  { path: '*', element: <div className='p-10 text-center text-red-500 text-xl font-bold'>404 — Page Not Found</div> },
]);

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <RouterProvider router={router} />
  </Suspense>
);

export default App;