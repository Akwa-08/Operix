// src/App.tsx

import {LandingPage} from "./pages/LandingPage";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {CustomerPage} from "./pages/CustomerPage";
import {ProfilePage} from "./pages/ProfilePage";
import {RootLayout} from "./pages/RootLayout";
import {CartPage} from "./pages/CartPage";
import {OrdersPage} from "./pages/OrdersPage";
import {MessagesPage} from "./pages/MessagesPage";

// Admin
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminManagement from "./components/Admin/AdminManagement";
import AdminOrders from "./components/Admin/AdminOrders";
import AdminMessages from "./components/Admin/AdminMessages";
import AdminInventory from "./components/Admin/AdminInventory";
import AdminPayroll from "./components/Admin/AdminPayroll";
import AdminProfile from "./components/Admin/AdminProfile";

// Cashier
import CashierPage from "./pages/CashierPage";
import CashierDashboard from "./components/Cashier/CashierDashboard";
import CashierOrders from "./components/Cashier/CashierOrders";
import CashierInventory from "./components/Cashier/CashierInventory";

// Designer
import DesignerPage from "./pages/DesignerPage";
import DesignerDashboard from "./components/Designer/DesignerDashboard";
import DesignerOrders from "./components/Designer/DesignerOrders";

// Production
import ProductionPage from "./pages/ProductionPage";
import ProductionDashboard from "./components/Production/ProductionDashboard";
import ProductionOrders from "./components/Production/ProductionOrders";
import ProductionInventory from "./components/Production/ProductionInventory";

// Auth
import {SignUpPage} from "./pages/SignUpPage";
import {ForgotPasswordPage} from "./pages/ForgotPasswordPage";

const router = createBrowserRouter([
  // Landing
  {path: "/", element: <LandingPage />},

  // Customer
  {
    element: <RootLayout />,
    children: [
      {path: "customer", element: <CustomerPage />},
      {path: "profile", element: <ProfilePage />},
      {path: "cart", element: <CartPage />},
      {path: "orders", element: <OrdersPage />},
      {path: "messages", element: <MessagesPage />},
    ],
  },

  // Admin
  {
    path: "/admin",
    element: <AdminPage />,
    children: [
      {index: true, element: <AdminDashboard />},
      {path: "users", element: <AdminManagement />},
      {path: "orders", element: <AdminOrders />},
      {path: "messages", element: <AdminMessages />},
      {path: "inventory", element: <AdminInventory />},
      {path: "payroll", element: <AdminPayroll />},
      {path: "profile", element: <AdminProfile />},
    ],
  },

  // Cashier
  {
    path: "/cashier",
    element: <CashierPage />,
    children: [
      {index: true, element: <CashierDashboard />},
      {path: "orders", element: <CashierOrders />},
      {path: "inventory", element: <CashierInventory />},
    ],
  },

  // Designer
  {
    path: "/designer",
    element: <DesignerPage />,
    children: [
      {index: true, element: <DesignerDashboard />},
      {path: "orders", element: <DesignerOrders />},
    ],
  },

  // Production
  {
    path: "/production",
    element: <ProductionPage />,
    children: [
      {index: true, element: <ProductionDashboard />},
      {path: "orders", element: <ProductionOrders />},
      {path: "inventory", element: <ProductionInventory />},
    ],
  },

  // Auth
  {path: "/signup", element: <SignUpPage />},
  {path: "/forgot-password", element: <ForgotPasswordPage />},

  // 404 Page
  {
    path: "*",
    element: (
      <div className="p-10 text-center text-red-500 text-xl font-bold">
        404 - Page Not Found
      </div>
    ),
  },
]);

import {Provider} from "react-redux";
import {store} from "./store";

const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;
