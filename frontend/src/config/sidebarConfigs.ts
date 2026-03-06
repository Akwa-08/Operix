import {
  Home as HouseIcon,
  ShoppingCart as CartIcon,
  PackageCheck as OrderIcon,
  MessageCircleMore as MessageIcon,
  Users as UsersIcon,
  DollarSign as PayrollIcon,
} from "lucide-react";
import type {SidebarItem} from "../components/Shared/UI/SharedSideBar";

export const customerSidebarItems: SidebarItem[] = [
  {label: "Home", icon: HouseIcon, path: "/customer", end: true},
  {label: "Cart", icon: CartIcon, path: "/cart"},
  {label: "Order", icon: OrderIcon, path: "/orders"},
  {label: "Messages", icon: MessageIcon, path: "/messages"},
];

export const adminSidebarItems: SidebarItem[] = [
  {label: "Dashboard", icon: HouseIcon, path: "/admin", end: true},
  {label: "Orders", icon: OrderIcon, path: "/admin/orders"},
  {label: "Management", icon: UsersIcon, path: "/admin/users"},
  {label: "Inventory", icon: CartIcon, path: "/admin/inventory"},
  {label: "Payroll", icon: PayrollIcon, path: "/admin/payroll"},
  {label: "Messages", icon: MessageIcon, path: "/admin/messages"},
];

export const cashierSidebarItems: SidebarItem[] = [
  {label: "Dashboard", icon: HouseIcon, path: "/cashier", end: true},
  {label: "Orders", icon: OrderIcon, path: "/cashier/orders"},
  {label: "Inventory", icon: CartIcon, path: "/cashier/inventory"},
];

export const designerSidebarItems: SidebarItem[] = [
  {label: "Dashboard", icon: HouseIcon, path: "/designer", end: true},
  {label: "My Orders", icon: OrderIcon, path: "/designer/orders"},
];

export const productionSidebarItems: SidebarItem[] = [
  {label: "Dashboard", icon: HouseIcon, path: "/production", end: true},
  {label: "Orders", icon: OrderIcon, path: "/production/orders"},
  {label: "Inventory", icon: CartIcon, path: "/production/inventory"},
];
