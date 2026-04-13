// frontend/src/App.tsx
// REFACTORED: Removed Redux — all state flows through Supabase hooks + AuthContext
// REFACTORED: All ProtectedRoute redirectTo now point to '/' (landing page with login modal)

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Customer
import { RootLayout } from './pages/RootLayout';
import { CustomerPage } from './pages/CustomerPage';
import { ProfilePage } from './pages/ProfilePage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { MessagesPage } from './pages/MessagesPage';

// Admin
import AdminPage from './pages/AdminPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminManagement from './components/Admin/AdminManagement';
import AdminOrders from './components/Admin/AdminOrders';
import AdminMessages from './components/Admin/AdminMessages';
import AdminInventory from './components/Admin/AdminInventory';
import AdminPayroll from './components/Admin/AdminPayroll';
import AdminProfile from './components/Admin/AdminProfile';
import AdminLogs from './components/Admin/AdminLogs';

// Cashier
import CashierPage from './pages/CashierPage';
import CashierDashboard from './components/Cashier/CashierDashboard';
import CashierOrders from './components/Cashier/CashierOrders';
import CashierInventory from './components/Cashier/CashierInventory';

// Designer
import DesignerPage from './pages/DesignerPage';
import DesignerDashboard from './components/Designer/DesignerDashboard';
import DesignerOrders from './components/Designer/DesignerOrders';

// Production
import ProductionPage from './pages/ProductionPage';
import ProductionDashboard from './components/Production/ProductionDashboard';
import ProductionOrders from './components/Production/ProductionOrders';
import ProductionInventory from './components/Production/ProductionInventory';

const router = createBrowserRouter([

  // ── PUBLIC ──────────────────────────────────────────────────────────────
  { path: '/',                element: <LandingPage /> },
  { path: '/signup',          element: <SignUpPage /> },
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
      { path: 'profile',   element: <AdminProfile /> },
      { path: 'logs',      element: <AdminLogs /> },
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
    ],
  },

  // ── 404 ─────────────────────────────────────────────────────────────────
  { path: '*', element: <div className='p-10 text-center text-red-500 text-xl font-bold'>404 — Page Not Found</div> },
]);

const App = () => (
  <RouterProvider router={router} />
);

export default App;