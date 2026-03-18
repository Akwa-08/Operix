// frontend/src/services/dataMappers.ts
// Converts backend snake_case responses to frontend camelCase format
// Used by all components that fetch from the API

// ── User / Employee mapping ──────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FrontendUser {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  contactNumber: string;
  address: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function mapUser(u: BackendUser): FrontendUser {
  return {
    id: u.id,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    userName: u.username || '',
    email: u.email || '',
    contactNumber: u.contact_number || '',
    address: u.address || '',
    role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '',
    isActive: u.is_active,
    createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
    updatedAt: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '',
  };
}

// ── Supplier mapping ─────────────────────────────────────────────────────────

export interface BackendSupplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FrontendSupplier {
  id: string;
  supplierName: string;
  contactPerson: string;
  email: string;
  contactNumber: string;
  address: string;
  supplierStatus: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  isFlagged: boolean;
  flagNotes: string;
  items: any[]; // populated separately if needed
}

export function mapSupplier(s: BackendSupplier): FrontendSupplier {
  return {
    id: s.id,
    supplierName: s.name || '',
    contactPerson: s.contact_person || '',
    email: s.email || '',
    contactNumber: s.phone || '',
    address: s.address || '',
    supplierStatus: s.is_active ? 'Active' : 'Inactive',
    createdAt: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    updatedAt: s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '',
    isFlagged: s.is_flagged || false,
    flagNotes: s.flag_reason || '',
    items: [],
  };
}

// ── Inventory Item mapping ───────────────────────────────────────────────────

export interface BackendInventoryItem {
  id: string;
  name: string;
  description: string | null;
  unit_of_measure: string;
  current_quantity: number;
  reorder_point: number;
  unit_cost: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  item_suppliers?: {
    id: string;
    supplier_unit_price: number;
    lead_time_days: number;
    is_preferred: boolean;
    suppliers: { id: string; name: string; } | null;
  }[];
}

export interface FrontendMaterial {
  id: string;
  itemType: string;
  itemVariant: string;
  usableStocks: number;
  stockUnit: string;
  reorderPoint: number;
  unitCost: number;
  purchaseQty: number;
  purchaseUnit: string;
  supplier: string;
  status: 'Available' | 'Low Stock' | 'Restocking' | 'Phased Out';
  isActive: boolean;
}

export function mapInventoryItem(item: BackendInventoryItem): FrontendMaterial {
  const qty = Number(item.current_quantity) || 0;
  const reorder = Number(item.reorder_point) || 0;
  const preferredSupplier = item.item_suppliers?.find(s => s.is_preferred);

  let status: FrontendMaterial['status'] = 'Available';
  if (!item.is_active) status = 'Phased Out';
  else if (qty <= 0) status = 'Restocking';
  else if (qty <= reorder) status = 'Low Stock';

  return {
    id: item.id,
    itemType: item.name || '',
    itemVariant: item.description || '',
    usableStocks: qty,
    stockUnit: item.unit_of_measure || '',
    reorderPoint: reorder,
    unitCost: Number(item.unit_cost) || 0,
    purchaseQty: 0,
    purchaseUnit: item.unit_of_measure || '',
    supplier: preferredSupplier?.suppliers?.name || '',
    status,
    isActive: item.is_active,
  };
}

// ── Product mapping ──────────────────────────────────────────────────────────

export interface BackendProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  size_spec: string | null;
  variant: string | null;
  material_cost: number;
  profit_fee: number;
  final_price: number;
  is_active: boolean;
  created_at: string;
}

export interface FrontendProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  sizeSpec: string;
  variant: string;
  materialCost: number;
  profitFee: number;
  finalPrice: number;
  isActive: boolean;
}

export function mapProduct(p: BackendProduct): FrontendProduct {
  return {
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    category: p.category || '',
    sizeSpec: p.size_spec || '',
    variant: p.variant || '',
    materialCost: Number(p.material_cost) || 0,
    profitFee: Number(p.profit_fee) || 0,
    finalPrice: Number(p.final_price) || 0,
    isActive: p.is_active,
  };
}

// ── Order mapping ────────────────────────────────────────────────────────────

export interface BackendOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  created_by: string | null;
  order_type: string;
  status: string;
  payment_status: string;
  assigned_designer: string | null;
  assigned_production: string | null;
  special_instructions: string | null;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: { first_name: string; last_name: string; email: string } | null;
  order_items?: BackendOrderItem[];
}

export interface BackendOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  specifications: string | null;
}

export interface FrontendOrder {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  productType: string;
  quantity: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
  paymentStatus: string;
  dateOrdered: string;
  dueDate: string;
  specialInstructions: string;
  items: BackendOrderItem[];
}

export function mapOrder(o: BackendOrder): FrontendOrder {
  const customerName = o.customer
    ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim()
    : 'Walk-in Customer';
  const firstItem = o.order_items?.[0];
  const totalQty = o.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return {
    id: o.id,
    orderId: o.order_number,
    customerName,
    customerEmail: o.customer?.email || '',
    orderType: o.order_type,
    productType: firstItem?.product_name || 'Multiple Items',
    quantity: totalQty,
    totalAmount: Number(o.total_amount) || 0,
    amountPaid: Number(o.amount_paid) || 0,
    status: o.status,
    paymentStatus: o.payment_status,
    dateOrdered: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    dueDate: o.due_date ? new Date(o.due_date).toLocaleDateString() : '',
    specialInstructions: o.special_instructions || '',
    items: o.order_items || [],
  };
}