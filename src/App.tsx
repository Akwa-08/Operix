import { LandingPage } from "./pages/LandingPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CustomerPage } from "./pages/CustomerPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProductsProvider } from "./context/ProductsContext";
import { RootLayout } from "./pages/RootLayout";
import { CartPage } from "./pages/CartPage";
import { OrdersPage } from "./pages/OrdersPage";
import { MessagesPage } from "./pages/MessagesPage";

import { AdminPage } from "./pages/AdminPage";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminManagement from "./components/Admin/AdminManagement";
import AdminOrders from "./components/Admin/AdminOrders";
import AdminMessages from "./components/Admin/AdminMessages";
import AdminInventory from "./components/Admin/AdminInventory";
import AdminPayroll from "./components/Admin/AdminPayroll";
import AdminProfile from "./components/Admin/AdminProfile";

import { SignUpPage } from "../src/pages/SignUpPage";
import { ForgotPasswordPage } from "../src/pages/ForgotPasswordPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <RootLayout />,
    children: [
      { path: "customer", element: <CustomerPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "cart", element: <CartPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "messages", element: <MessagesPage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminPage />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <AdminManagement /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "messages", element: <AdminMessages /> },
      { path: "inventory", element: <AdminInventory /> },
      { path: "payroll", element: <AdminPayroll /> },   
      { path: "profile", element: <AdminProfile /> },  
    ],
  },

    // In your router:
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  }
]);


const App = () => {
  return (
    <ProductsProvider>
      <RouterProvider router={router} />
    </ProductsProvider>
  );
};

export default App;
