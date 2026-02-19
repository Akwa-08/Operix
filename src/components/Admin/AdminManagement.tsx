import { useState } from "react";
import {
  Search,
  Eye,
  Flag,
  FileText,
  ChevronDown,
  X,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";

// Types for backend integration
interface UserAccount {
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

interface Employee {
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

interface Supplier {
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

interface SupplierItem {
  itemType: string;
  itemVariant: string;
}

const AdminManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("User Account Management");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateSort, setSelectedDateSort] = useState("Ascending");
  const [selectedRole, setSelectedRole] = useState("Select Role");
  const [selectedStatus, setSelectedStatus] = useState("Select Status");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showSupplierInfoModal, setShowSupplierInfoModal] = useState(false);
  const [showFlagNotesModal, setShowFlagNotesModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserAccount | Employee | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserAccount | Employee | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    username: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    username: "",
    role: "",
  });

  const [flagNotes, setFlagNotes] = useState("");
  const [supplierFlags, setSupplierFlags] = useState<{ [key: string]: boolean }>({});

  const tabs = [
    "User Account Management",
    "Employee List Management",
    "Supplier List Management",
  ];

  const roles = ["Admin", "Cashier", "Designer", "Production", "Customer"];
  const statuses = ["Active", "Inactive"];

  // DUMMY DATA
  const userAccounts: UserAccount[] = [
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
      userName: "Admin",
      email: "VTALPS@gmail.com",
      contactNumber: "12345678901",
      role: "Admin",
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
  ];

  const employees: Employee[] = [
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
  ];

  const suppliers: Supplier[] = [
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
        { itemType: "Tarpaulin roll", itemVariant: "Small - 6.1 ft" },
        { itemType: "Tarpaulin roll", itemVariant: "Medium - 8.2 ft" },
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
      items: [
        { itemType: "Tarpaulin roll", itemVariant: "Small - 6.1 ft" },
      ],
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
      flagNotes: "The tarpaulin lacks sufficient durability and weather resistance, leading to faster wear and reduced usability outdoors.",
      items: [],
    },
  ];

  // Handler functions
  const handleViewUser = (user: UserAccount | Employee) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.contactNumber,
      email: user.email,
      username: user.userName,
      role: user.role,
    });
    setShowViewModal(true);
  };

  const handleCreateNew = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      username: "",
      role: "",
      password: "",
      confirmPassword: "",
    });
    setShowCreateModal(true);
  };

  const handleCreateAccount = () => {
    console.log("Create account:", createForm);
    // TODO: API call to create account
    alert("Account created successfully!");
    setShowCreateModal(false);
  };

  const handleUpdateAccount = () => {
    console.log("Update account:", editForm);
    // TODO: API call to update account
    alert("Account updated successfully!");
    setShowViewModal(false);
  };

  const handleDeactivateClick = (user: UserAccount | Employee) => {
    setUserToDeactivate(user);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = () => {
    console.log("Deactivate user:", userToDeactivate);
    // TODO: API call to deactivate user
    alert(`User ${userToDeactivate?.firstName} ${userToDeactivate?.lastName} has been deactivated`);
    setShowDeactivateModal(false);
    setUserToDeactivate(null);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierInfoModal(true);
  };

  const handleToggleFlag = (supplierId: string) => {
    setSupplierFlags((prev) => ({
      ...prev,
      [supplierId]: !prev[supplierId],
    }));
    // TODO: API call to toggle flag
  };

  const handleOpenFlagNotes = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFlagNotes(supplier.flagNotes);
    setShowFlagNotesModal(true);
  };

  const handleSaveFlagNotes = () => {
    console.log("Save flag notes for supplier:", selectedSupplier?.id, flagNotes);
    // TODO: API call to save notes
    alert("Notes saved successfully!");
    setShowFlagNotesModal(false);
  };

  const getCurrentData = () => {
    if (activeTab === "User Account Management") return userAccounts;
    if (activeTab === "Employee List Management") return employees;
    return suppliers;
  };

  const filteredData = getCurrentData().filter((item: any) => {
    const matchesSearch =
      item.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "Select Role" || item.role === selectedRole;
    const matchesStatus = selectedStatus === "Select Status" || item.supplierStatus === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* View/Edit User Modal */}
      {showViewModal && selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Account Info
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="09XX XXX XXXX"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ABCD@email.com"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="JD"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none bg-white"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAccount}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Create Account
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={createForm.firstName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={createForm.lastName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="09XX XXX XXXX"
                  value={createForm.phoneNumber}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ABCD@email.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="JD"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none bg-white"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  value={createForm.confirmPassword}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && userToDeactivate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeactivateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm Deactivation
                </h3>
                <p className="text-sm text-gray-500">
                  Please review the details before proceeding
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {userToDeactivate.firstName} {userToDeactivate.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {userToDeactivate.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {userToDeactivate.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Username:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {userToDeactivate.userName}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              This user will be deactivated and will no longer have access to the
              system. This action can be reversed later if needed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivate}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Info Modal */}
      {showSupplierInfoModal && selectedSupplier && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSupplierInfoModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSupplierInfoModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Supplier Info
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Supplier Name
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900">{selectedSupplier.supplierName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900">{selectedSupplier.address}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900">{selectedSupplier.contactNumber}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900">{selectedSupplier.email}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {selectedSupplier.items.length > 0 && (
              <div className="mb-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Created At
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Update At
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Supplier Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Item Type
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Item Variant
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSupplier.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            {selectedSupplier.createdAt}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {selectedSupplier.updatedAt}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {selectedSupplier.supplierStatus}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {item.itemType}
                          </td>
                          <td className="px-4 py-3 text-gray-900">
                            {item.itemVariant}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                <FileText size={16} className="text-gray-600" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                <Flag size={16} className="text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowSupplierInfoModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-white border-2 border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-colors flex items-center gap-2">
                <Edit2 size={20} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Notes Modal */}
      {showFlagNotesModal && selectedSupplier && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFlagNotesModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in fade-in zoom-in duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFlagNotesModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Comments</h3>

            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                Supplies Quality
              </h4>
              <div className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
                <textarea
                  value={flagNotes}
                  onChange={(e) => setFlagNotes(e.target.value)}
                  placeholder="Add notes about this supplier..."
                  className="w-full h-full min-h-[150px] bg-transparent border-none resize-none focus:outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveFlagNotes}
                className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage different accounts and lists
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={handleCreateNew}
          className="px-6 py-2.5 bg-white border-2 border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors"
        >
          Create New
        </button>
        <button
          onClick={() => {
            if (activeTab !== "Supplier List Management") {
              // For users, show deactivate modal for selected
              alert("Please select a user to deactivate");
            } else {
              alert("Deactivate functionality for suppliers");
            }
          }}
          className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
        >
          Deactivate
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? "bg-cyan-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.replace(" Management", "")}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Date Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowRoleDropdown(false);
                setShowStatusDropdown(false);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center justify-between gap-2 min-w-[180px]"
            >
              <span className="text-gray-500">Date Created At</span>
              <ChevronDown size={16} />
            </button>
            {showDateDropdown && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedDateSort("Ascending");
                    setShowDateDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    selectedDateSort === "Ascending" ? "bg-gray-50 font-semibold" : ""
                  }`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => {
                    setSelectedDateSort("Descending");
                    setShowDateDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    selectedDateSort === "Descending" ? "bg-gray-50 font-semibold" : ""
                  }`}
                >
                  Descending
                </button>
              </div>
            )}
          </div>

          {/* Role Dropdown - Only for User/Employee tabs */}
          {activeTab !== "Supplier List Management" && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowDateDropdown(false);
                  setShowStatusDropdown(false);
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center justify-between gap-2 min-w-[150px]"
              >
                <span>{selectedRole}</span>
                <ChevronDown size={16} />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedRole("Select Role");
                      setShowRoleDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    All Roles
                  </button>
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                        selectedRole === role ? "bg-gray-50 font-semibold" : ""
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status Dropdown - Only for Supplier tab */}
          {activeTab === "Supplier List Management" && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowDateDropdown(false);
                  setShowRoleDropdown(false);
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white flex items-center justify-between gap-2 min-w-[150px]"
              >
                <span>{selectedStatus}</span>
                <ChevronDown size={16} />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedStatus("Select Status");
                      setShowStatusDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    All Status
                  </button>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                        selectedStatus === status ? "bg-gray-50 font-semibold" : ""
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Based on Active Tab */}
      {activeTab === "User Account Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 p-6 border-b">
            User Account Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    First Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Last Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    User Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Contact Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Update At
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(filteredData as UserAccount[]).map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-gray-900">{user.firstName}</td>
                    <td className="px-4 py-3 text-gray-900">{user.lastName}</td>
                    <td className="px-4 py-3 text-gray-900">{user.userName}</td>
                    <td className="px-4 py-3 text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {user.contactNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{user.role}</td>
                    <td className="px-4 py-3 text-gray-900">{user.createdAt}</td>
                    <td className="px-4 py-3 text-gray-900">{user.updatedAt}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-1.5 hover:bg-cyan-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} className="text-cyan-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Employee List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 p-6 border-b">
            Employee List
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    First Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Last Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    User Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Contact Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Update At
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(filteredData as Employee[]).map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.firstName}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.userName}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{employee.email}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.contactNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{employee.role}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.createdAt}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {employee.updatedAt}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewUser(employee)}
                        className="p-1.5 hover:bg-cyan-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} className="text-cyan-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Supplier List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-gray-900 p-6 border-b">
            Supplier List
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Supplier Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Contact Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Supplier Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Update At
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(filteredData as Supplier[]).map((supplier) => {
                  const isFlagged =
                    supplierFlags[supplier.id] ?? supplier.isFlagged;
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {supplier.supplierName}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{supplier.email}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {supplier.contactNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {supplier.supplierStatus}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {supplier.createdAt}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {supplier.updatedAt}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewSupplier(supplier)}
                            className="p-1.5 hover:bg-cyan-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} className="text-cyan-600" />
                          </button>
                          <button
                            onClick={() => handleToggleFlag(supplier.id)}
                            className={`p-1.5 hover:bg-red-100 rounded-lg transition-colors ${
                              isFlagged ? "bg-red-50" : ""
                            }`}
                            title={isFlagged ? "Flagged" : "Flag Supplier"}
                          >
                            <Flag
                              size={18}
                              className={isFlagged ? "text-red-600 fill-red-600" : "text-gray-600"}
                            />
                          </button>
                          <button
                            onClick={() => handleOpenFlagNotes(supplier)}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                            title="View Notes"
                          >
                            <FileText size={18} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;