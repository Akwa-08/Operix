import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Home as HouseIcon,
  PackageCheck as OrderIcon,
  Users as UsersIcon,
  ShoppingCart as InventoryIcon,
  DollarSign as PayrollIcon,
  MessageCircleMore as MessageIcon,
  User as ProfileIcon,
} from "lucide-react";

type Props = {
  name: string;
};

const adminSidebarItems = [
  { label: "Dashboard", icon: HouseIcon, path: "/admin" },
  { label: "Orders", icon: OrderIcon, path: "/admin/orders" },
  { label: "Management", icon: UsersIcon, path: "/admin/users" },
  { label: "Inventory", icon: InventoryIcon, path: "/admin/products" },
  { label: "Payroll", icon: PayrollIcon, path: "/admin/payroll" },
  { label: "Messages", icon: MessageIcon, path: "/admin/messages" },
  { label: "Profile", icon: ProfileIcon, path: "/admin/profile" },
];

const AdminSideBar = ({ name }: Props) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Hide sidebar on home (landing) page
  if (location.pathname === "/") return null;
  //TEMPORARY RNI EHEHEH

  const isActiveClass = "bg-pink-600 text-white";
  const isNotActiveClass = "text-black hover:bg-gray-100";

  return createPortal(
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow"
      >
        ☰
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-white text-black
          fixed top-0 left-0 h-screen z-50
          w-64 lg:w-1/5
          border-r border-gray-200 shadow-lg
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <header className="flex flex-col">
          {/* Profile Section */}
          <section className="flex items-center p-6 gap-4 border-b mb-4">
            <AccountCircleIcon sx={{ fontSize: 52 }} />
            <p className="text-xl font-bold">{name}</p>
          </section>

          {/* Navigation Links */}
          <nav className="p-6 space-y-1">
            {adminSidebarItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/admin"} // only Dashboard exact match
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-md transition ${
                    isActive ? isActiveClass : isNotActiveClass
                  }`
                }
              >
                <item.icon size={28} />
                <span className="text-xl font-semibold">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </header>
      </aside>
    </>,
    document.getElementById("modal")!
  );
};

export default AdminSideBar;
