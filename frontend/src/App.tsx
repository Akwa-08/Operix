import {LandingPage} from "./pages/LandingPage";
import {CustomerPage} from "./pages/CustomerPage";
import {ProfilePage} from "./pages/ProfilePage";
import {ProductsProvider} from "./context/ProductsContext";
import {RootLayout} from "./pages/RootLayout";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {CartPage} from "./pages/CartPage";
import {OrdersPage} from "./pages/OrdersPage";
import {MessagesPage} from "./pages/MessagesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
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
]);

const App = () => {
  return (
    <ProductsProvider>
      <RouterProvider router={router} />
    </ProductsProvider>
  );
};

export default App;
