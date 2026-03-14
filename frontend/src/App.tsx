// frontend/src/App.tsx
 
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
 
// Pages
import { LandingPage } from './pages/LandingPage';
import StaffLoginPage from './pages/StaffLoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
 
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
// import AdminProducts from './components/Admin/AdminProducts';
 
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
  { path: '/staff-login',     element: <StaffLoginPage /> },
 
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
    element: <ProtectedRoute allowedRoles={['admin']} redirectTo='/staff-login'><AdminPage /></ProtectedRoute>,
    children: [
      { index: true,       element: <AdminDashboard /> },
      { path: 'users',     element: <AdminManagement /> },
      { path: 'orders',    element: <AdminOrders /> },
      { path: 'messages',  element: <AdminMessages /> },
      { path: 'inventory', element: <AdminInventory /> },
      { path: 'payroll',   element: <AdminPayroll /> },
      { path: 'profile',   element: <AdminProfile /> },
      // { path: 'products',  element: <AdminProducts /> },
    ],
  },
 
  // ── CASHIER (role: cashier) ──────────────────────────────────────────────
  {
    path: '/cashier',
    element: <ProtectedRoute allowedRoles={['cashier']} redirectTo='/staff-login'><CashierPage /></ProtectedRoute>,
    children: [
      { index: true,       element: <CashierDashboard /> },
      { path: 'orders',    element: <CashierOrders /> },
      { path: 'inventory', element: <CashierInventory /> },
    ],
  },
 
  // ── DESIGNER (role: designer) ────────────────────────────────────────────
  {
    path: '/designer',
    element: <ProtectedRoute allowedRoles={['designer']} redirectTo='/staff-login'><DesignerPage /></ProtectedRoute>,
    children: [
      { index: true,    element: <DesignerDashboard /> },
      { path: 'orders', element: <DesignerOrders /> },
    ],
  },
 
  // ── PRODUCTION (role: production) ────────────────────────────────────────
  {
    path: '/production',
    element: <ProtectedRoute allowedRoles={['production']} redirectTo='/staff-login'><ProductionPage /></ProtectedRoute>,
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
  <Provider store={store}><RouterProvider router={router} /></Provider>
);
 
export default App;


