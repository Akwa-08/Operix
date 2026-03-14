export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  contactNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  contactNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierItem {
  itemType: string;
  itemVariant: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  email: string;
  contactNumber: string;
  address: string;
  supplierStatus: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  isFlagged: boolean;
  flagNotes: string;
  items: SupplierItem[];
}

export interface ManagementData {
  userAccounts: UserAccount[];
  employees: Employee[];
  suppliers: Supplier[];
}

export const managementData: ManagementData = {
  userAccounts: [
    {
      id: "U001",
      firstName: "Cen",
      lastName: "Tino",
      userName: "Admin",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      role: "Admin",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
    },
    {
      id: "U002",
      firstName: "Mary Jane",
      lastName: "Centino",
      userName: "Manager1",
      email: "maryjane@gmail.com",
      contactNumber: "12345678902",
      role: "Management",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
    },
    {
      id: "U003",
      firstName: "Cashie",
      lastName: "Yir",
      userName: "Cashier",
      email: "Cashie@gmail.com",
      contactNumber: "23456789012",
      role: "Cashier",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
  ],
  employees: [
    {
      id: "E001",
      firstName: "Cen",
      lastName: "Tino",
      userName: "Admin",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      role: "Admin",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
    },
    {
      id: "E002",
      firstName: "Mary Jane",
      lastName: "Centino",
      userName: "Admin",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      role: "Admin",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
    },
    {
      id: "E003",
      firstName: "Cashie",
      lastName: "Yir",
      userName: "Cashier",
      email: "Cashie@gmail.com",
      contactNumber: "23456789012",
      role: "Cashier",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
    {
      id: "E004",
      firstName: "Des",
      lastName: "Igner",
      userName: "Designer1",
      email: "Igner@gmail.com",
      contactNumber: "34567890123",
      role: "Designer",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
    {
      id: "E005",
      firstName: "Del",
      lastName: "Sayner",
      userName: "Designer2",
      email: "Sayner@gmail.com",
      contactNumber: "45678901234",
      role: "Designer",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
    {
      id: "E006",
      firstName: "John",
      lastName: "Doe",
      userName: "Production",
      email: "Doe@gmail.com",
      contactNumber: "78901234567",
      role: "Production",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
    {
      id: "E007",
      firstName: "John",
      lastName: "Cena",
      userName: "Production",
      email: "Cena@gmail.com",
      contactNumber: "89012345678",
      role: "Production",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
    },
  ],
  suppliers: [
    {
      id: "S001",
      supplierName: "ABC co.",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Active",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
      isFlagged: false,
      flagNotes: "",
      items: [
        {itemType: "Tarpaulin roll", itemVariant: "Small - 6.1 ft"},
        {itemType: "Tarpaulin roll", itemVariant: "Medium - 8.2 ft"},
      ],
    },
    {
      id: "S002",
      supplierName: "Fabre co.",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Active",
      createdAt: "1/10/2025",
      updatedAt: "1/15/2025",
      isFlagged: false,
      flagNotes: "",
      items: [{itemType: "Tarpaulin roll", itemVariant: "Small - 6.1 ft"}],
    },
    {
      id: "S003",
      supplierName: "JFJF co.",
      email: "Cashie@gmail.com",
      contactNumber: "23456789012",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Active",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
      isFlagged: false,
      flagNotes: "",
      items: [],
    },
    {
      id: "S004",
      supplierName: "QWE co.",
      email: "Igner@gmail.com",
      contactNumber: "34567890123",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Active",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
      isFlagged: false,
      flagNotes: "",
      items: [],
    },
    {
      id: "S005",
      supplierName: "RTY co.",
      email: "Sayner@gmail.com",
      contactNumber: "45678901234",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Active",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
      isFlagged: false,
      flagNotes: "",
      items: [],
    },
    {
      id: "S006",
      supplierName: "Tailor Swift",
      email: "Production@gmail.com",
      contactNumber: "56789012345",
      address: "Subdivision, Barangay, Surigao City",
      supplierStatus: "Inactive",
      createdAt: "1/10/2025",
      updatedAt: "3/10/2025",
      isFlagged: true,
      flagNotes:
        "The tarpaulin lacks sufficient durability and weather resistance, leading to faster wear and reduced usability outdoors.",
      items: [],
    },
  ],
};
