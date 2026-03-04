// src\util\permissions.ts

export type UserRole = 'admin' | 'cashier' | 'designer' | 'production';

export interface InventoryPermissions {
  canViewAll: boolean;
  canEditAllFields: boolean;
  canEditStock: boolean;
  canDelete: boolean;
  canAdd: boolean;
  canViewCost: boolean;
  canCreateResupply: boolean;
}

export interface OrdersPermissions {
  canViewAll: boolean;
  canViewAssigned: boolean;
  canCreate: boolean;
  canEditAll: boolean;
  canEditStatus: boolean;
  canAssignStaff: boolean;
  canDelete: boolean;
  canUploadDesign: boolean;
  canUpdateDesignStatus: boolean;
  canUpdateProductionStatus: boolean;
}

export interface PayrollPermissions {
  canView: boolean;
  canEdit: boolean;
  canExport: boolean;
}

export interface ManagementPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canCreateUsers: boolean;
  canDeactivateUsers: boolean;
  canManageSuppliers: boolean;
}

export interface RolePermissions {
  inventory: InventoryPermissions;
  orders: OrdersPermissions;
  payroll: PayrollPermissions;
  management: ManagementPermissions;
}

export const permissions: Record<UserRole, RolePermissions> = {
  admin: {
    inventory: {
      canViewAll: true,
      canEditAllFields: true,
      canEditStock: true,
      canDelete: true,
      canAdd: true,
      canViewCost: true,
      canCreateResupply: true,
    },
    orders: {
      canViewAll: true,
      canViewAssigned: true,
      canCreate: true,
      canEditAll: true,
      canEditStatus: true,
      canAssignStaff: true,
      canDelete: true,
      canUploadDesign: true,
      canUpdateDesignStatus: true,
      canUpdateProductionStatus: true,
    },
    payroll: {
      canView: true,
      canEdit: true,
      canExport: true,
    },
    management: {
      canViewUsers: true,
      canEditUsers: true,
      canCreateUsers: true,
      canDeactivateUsers: true,
      canManageSuppliers: true,
    },
  },
  
  cashier: {
    inventory: {
      canViewAll: true,
      canEditAllFields: false,
      canEditStock: true, // Can only update stock numbers
      canDelete: false,
      canAdd: false,
      canViewCost: true,
      canCreateResupply: false,
    },
    orders: {
      canViewAll: true,
      canViewAssigned: true,
      canCreate: true,
      canEditAll: false,
      canEditStatus: true,
      canAssignStaff: false,
      canDelete: false,
      canUploadDesign: false,
      canUpdateDesignStatus: false,
      canUpdateProductionStatus: false,
    },
    payroll: {
      canView: false,
      canEdit: false,
      canExport: false,
    },
    management: {
      canViewUsers: false,
      canEditUsers: false,
      canCreateUsers: false,
      canDeactivateUsers: false,
      canManageSuppliers: false,
    },
  },
  
  designer: {
    inventory: {
      canViewAll: false,
      canEditAllFields: false,
      canEditStock: false,
      canDelete: false,
      canAdd: false,
      canViewCost: false,
      canCreateResupply: false,
    },
    orders: {
      canViewAll: false,
      canViewAssigned: true, // Only assigned orders
      canCreate: false,
      canEditAll: false,
      canEditStatus: false,
      canAssignStaff: false,
      canDelete: false,
      canUploadDesign: true,
      canUpdateDesignStatus: true,
      canUpdateProductionStatus: false,
    },
    payroll: {
      canView: false,
      canEdit: false,
      canExport: false,
    },
    management: {
      canViewUsers: false,
      canEditUsers: false,
      canCreateUsers: false,
      canDeactivateUsers: false,
      canManageSuppliers: false,
    },
  },
  
  production: {
    inventory: {
      canViewAll: true,
      canEditAllFields: false,
      canEditStock: true, // Can update stock after production
      canDelete: false,
      canAdd: false,
      canViewCost: false,
      canCreateResupply: true, // Can create resupply orders
    },
    orders: {
      canViewAll: false,
      canViewAssigned: true, // Only assigned orders
      canCreate: false,
      canEditAll: false,
      canEditStatus: false,
      canAssignStaff: false,
      canDelete: false,
      canUploadDesign: false,
      canUpdateDesignStatus: false,
      canUpdateProductionStatus: true,
    },
    payroll: {
      canView: false,
      canEdit: false,
      canExport: false,
    },
    management: {
      canViewUsers: false,
      canEditUsers: false,
      canCreateUsers: false,
      canDeactivateUsers: false,
      canManageSuppliers: false,
    },
  },
};

// Helper function to check permissions
export const hasPermission = (
  role: UserRole,
  module: keyof RolePermissions,
  permission: string
): boolean => {
  const rolePermissions = permissions[role];
  const modulePermissions = rolePermissions[module] as any;
  return modulePermissions[permission] === true;
};

// Helper to get all permissions for a role
export const getPermissions = (role: UserRole): RolePermissions => {
  return permissions[role];
};
