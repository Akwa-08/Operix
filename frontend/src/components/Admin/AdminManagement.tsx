import {useState} from "react";
import {
  Search,
  Eye,
  Flag,
  FileText,
  ChevronDown,
  X,
  Check,
  Trash2,

  AlertTriangle,
  Power,
  Package,
} from "lucide-react";
import {useManagementData, useInventoryData} from "../../hooks/useSupabase";
import {LoadingSpinner} from "../Shared/UI/LoadingSpinner";
import {useToast} from "../../context/ToastContext";
import type {FrontendUser, FrontendSupplier, EmployeeRecord} from "../../Types";

type Supplier = FrontendSupplier;



// ── Inline Error Banner ───────────────────────────────────────────────
function ErrBanner({msg}: {msg: string}) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
      <AlertTriangle size={14} className="flex-shrink-0" />
      {msg}
    </div>
  );
}

// ── Reusable field ───────────────────────────────────────────────────
const F = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
}: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-sm"
    />
  </div>
);

// ── Modal wrapper ────────────────────────────────────────────────────
const Modal = ({show, onClose, title, children, width = "max-w-2xl"}: any) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl ${width} w-full p-8 relative`}
        onClick={(e: any) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} className="text-gray-600" />
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const AdminManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("User Account Management");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Select Role");
  const [selectedStatus, setSelectedStatus] = useState("Select Status");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const toast = useToast();

  // Form errors
  const [formErr, setFormErr] = useState("");

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCreateEmpModal, setShowCreateEmpModal] = useState(false);
  const [showViewEmpModal, setShowViewEmpModal] = useState(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [showSupplierInfoModal, setShowSupplierInfoModal] = useState(false);
  const [showFlagNotesModal, setShowFlagNotesModal] = useState(false);
  const [showManageMaterialsModal, setShowManageMaterialsModal] = useState(false);
  const [mappedMaterialIds, setMappedMaterialIds] = useState<string[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [savingMapping, setSavingMapping] = useState(false);
  const [empToDeactivate, setEmpToDeactivate] = useState<EmployeeRecord | null>(
    null,
  );

  // Selected items
  const [selectedUser, setSelectedUser] = useState<FrontendUser | null>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [userToDeactivate, setUserToDeactivate] = useState<FrontendUser | null>(
    null,
  );

  // Forms
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [editUserForm, setEditUserForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    role: "",
  });

  // Employee forms — now includes role
  const [empForm, setEmpForm] = useState({
    employeeCode: "",
    fullName: "",
    position: "",
    role: "",
    baseHourlyRate: "",
    hireDate: new Date().toISOString().split("T")[0],
  });
  const [editEmpForm, setEditEmpForm] = useState({
    fullName: "",
    position: "",
    role: "",
    baseHourlyRate: "",
    holidayMultiplier: "",
    overtimeMultiplier: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editSupplierForm, setEditSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [flagNotes, setFlagNotes] = useState("");

  const tabs = [
    "User Account Management",
    "Employee List Management",
    "Supplier List Management",
  ];
  const accountRoles = [
    "Admin",
    "Cashier",
    "Designer",
    "Production",
    "Customer",
  ];
  const employeeRoles = ["Admin", "Cashier", "Designer", "Production"];
  const statuses = ["Active", "Inactive"];

  const {
    users,
    employees,
    suppliers,
    loading,
    createUser,
    updateUser,
    deactivateUsers,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    createSupplier,
    updateSupplier,
    flagSupplier,
    toggleSupplierActive,
    getSupplierMaterials,
    updateSupplierMaterials,
  } = useManagementData();
  const {materials} = useInventoryData();

  // ── Context-aware Create New ─────────────────────────────────────────
  const handleCreateNew = () => {
    if (activeTab === "User Account Management") {
      setUserForm({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
      setShowCreateUserModal(true);
    } else if (activeTab === "Employee List Management") {
      setEmpForm({
        employeeCode: "",
        fullName: "",
        position: "",
        role: "",
        baseHourlyRate: "",
        hireDate: new Date().toISOString().split("T")[0],
      });
      setShowCreateEmpModal(true);
    } else {
      setSupplierForm({name: "", phone: "", email: "", address: ""});
      setShowCreateSupplierModal(true);
    }
  };

  // ── User handlers ────────────────────────────────────────────────────
  const handleViewUser = (u: FrontendUser) => {
    setSelectedUser(u);
    setEditUserForm({
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.contactNumber,
      email: u.email,
      role: u.role,
    });
    setShowViewUserModal(true);
  };

  const handleSubmitCreateUser = async () => {
    setFormErr("");
    if (userForm.password !== userForm.confirmPassword) {
      setFormErr("Passwords do not match");
      return;
    }
    if (!userForm.email || !userForm.password || !userForm.role) {
      setFormErr("Fill all required fields (Email, Password, Role)");
      return;
    }
    const r = await createUser({
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      phoneNumber: userForm.phoneNumber,
    });
    if (r.success) {
      toast.success("Account created successfully!");
      setShowCreateUserModal(false);
    } else setFormErr(r.error || "Failed to create account");
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const r = await updateUser(selectedUser.id, {
      firstName: editUserForm.firstName,
      lastName: editUserForm.lastName,
      email: editUserForm.email,
      phoneNumber: editUserForm.phoneNumber,
      role: editUserForm.role,
    });
    if (r.success) {
      toast.success("Account updated!");
      setShowViewUserModal(false);
    } else toast.error(r.error || "Failed to update account");
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    const r = await deactivateUsers([userToDeactivate.id]);
    if (r.success)
      toast.success(
        `${userToDeactivate.firstName} ${userToDeactivate.lastName} deactivated`,
      );
    else toast.error(r.error || "Failed to deactivate");
    setShowDeactivateModal(false);
    setUserToDeactivate(null);
  };

  // ── Employee handlers ────────────────────────────────────────────────
  const handleViewEmp = (e: EmployeeRecord) => {
    setSelectedEmployee(e);
    setEditEmpForm({
      fullName: e.fullName,
      position: e.position,
      role: (e as any).role || "",
      baseHourlyRate: String(e.baseHourlyRate),
      holidayMultiplier: String(e.holidayRateMultiplier),
      overtimeMultiplier: String(e.overtimeRateMultiplier),
    });
    setShowViewEmpModal(true);
  };

  const handleSubmitCreateEmp = async () => {
    setFormErr("");
    if (!empForm.fullName || !empForm.position) {
      setFormErr("Full name and position are required");
      return;
    }
    if (!empForm.role) {
      setFormErr(
        "Role is required — select Cashier, Designer, Production, or Admin",
      );
      return;
    }
    const r = await createEmployee({
      employeeCode: empForm.employeeCode,
      fullName: empForm.fullName,
      position: empForm.position,
      role: empForm.role as import("../../Types").EmployeeRole,
      baseHourlyRate: Number(empForm.baseHourlyRate) || 0,
      hireDate: empForm.hireDate,
    });
    if (r.success) {
      toast.success("Employee record created!");
      setShowCreateEmpModal(false);
    } else setFormErr(r.error || "Failed to create employee");
  };

  const handleUpdateEmp = async () => {
    if (!selectedEmployee) return;
    const r = await updateEmployee(selectedEmployee.id, {
      fullName: editEmpForm.fullName,
      position: editEmpForm.position,
      role: editEmpForm.role,
      baseHourlyRate: Number(editEmpForm.baseHourlyRate) || 0,
      holidayMultiplier: Number(editEmpForm.holidayMultiplier) || 2.0,
      overtimeMultiplier: Number(editEmpForm.overtimeMultiplier) || 1.5,
    });
    if (r.success) {
      toast.success("Employee updated!");
      setShowViewEmpModal(false);
    } else toast.error(r.error || "Failed to update employee");
  };

  const handleDeactivateEmp = async () => {
    if (!empToDeactivate) return;
    const r = await deactivateEmployee(empToDeactivate.id);
    if (r.success) toast.success(`${empToDeactivate.fullName} deactivated`);
    else toast.error(r.error || "Failed to deactivate");
    setEmpToDeactivate(null);
  };

  // ── Supplier handlers ────────────────────────────────────────────────
  const handleViewSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setEditSupplierForm({
      name: s.supplierName || "",
      phone: s.contactNumber || "",
      email: s.email || "",
      address: s.address || "",
    });
    setShowSupplierInfoModal(true);
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;
    if (!editSupplierForm.name.trim()) {
      toast.error("Supplier name required");
      return;
    }
    const r = await updateSupplier(selectedSupplier.id, {
      name: editSupplierForm.name,
      phone: editSupplierForm.phone,
      email: editSupplierForm.email,
      address: editSupplierForm.address,
    });
    if (r.success) {
      toast.success("Supplier updated!");
      setShowSupplierInfoModal(false);
    } else {
      toast.error(r.error || "Failed to update supplier");
    }
  };

  const handleSubmitCreateSupplier = async () => {
    if (!supplierForm.name.trim() || !supplierForm.phone.trim() || !supplierForm.email.trim() || !supplierForm.address.trim()) {
      toast.error("Name, Phone, Email, and Address are required.");
      return;
    }
    const r = await createSupplier({
      name: supplierForm.name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
    });
    if (r.success) {
      toast.success("Supplier created!");
      setShowCreateSupplierModal(false);
    } else toast.error("Error: " + r.error);
  };

  const handleToggleFlag = async (id: string) => {
    const s = suppliers.find((x) => x.id === id);
    if (!s) return;
    await flagSupplier(
      id,
      !s.isFlagged,
      !s.isFlagged ? "Flagged by admin" : "",
    );
  };

  const handleToggleSupplierActive = async (s: Supplier) => {
    const nowActive = s.supplierStatus !== "Active";
    const r = await toggleSupplierActive(s.id, nowActive);
    if (r.success) {
      toast.success(`Supplier ${nowActive ? "activated" : "set to inactive"}`);
      setShowSupplierInfoModal(false);
    } else {
      toast.error(r.error || "Failed to update supplier status");
    }
  };

  const handleSaveFlagNotes = async () => {
    if (!selectedSupplier) return;
    const r = await flagSupplier(selectedSupplier.id, true, flagNotes);
    if (r.success) toast.success("Notes saved!");
    else toast.error(r.error || "Failed to save notes");
    setShowFlagNotesModal(false);
  };

  const handleManageMaterials = async (s: Supplier) => {
    setSelectedSupplier(s);
    try {
      const currentMapping = await getSupplierMaterials(s.id);
      setMappedMaterialIds(currentMapping.map((m: any) => m.inventory_item_id));
      setShowManageMaterialsModal(true);
    } catch (err: any) {
      toast.error("Failed to fetch supplier materials");
    }
  };

  const handleSaveMaterialsMapping = async () => {
    if (!selectedSupplier) return;
    setSavingMapping(true);
    const r = await updateSupplierMaterials(
      selectedSupplier.id,
      mappedMaterialIds,
    );
    if (r.success) {
      toast.success("Supplier materials updated");
      setShowManageMaterialsModal(false);
    } else {
      toast.error(r.error || "Failed to update mapping");
    }
    setSavingMapping(false);
  };

  // ── Filtering + Sorting ──────────────────────────────────────────────
  const filteredUsers = users
    .filter((u) => {
      const ms =
        !searchQuery ||
        [u.firstName, u.lastName, u.email].some((f: string) =>
          (f || "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const mr = selectedRole === "Select Role" || u.role === selectedRole;
      return ms && mr;
    })
    .sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  const filteredEmployees = employees.filter(
    (e) =>
      !searchQuery ||
      [e.fullName, e.position, e.employeeCode, (e as any).role || ""].some(
        (f: string) =>
          (f || "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );
  const filteredSuppliers = suppliers
    .filter((s) => {
      const ms =
        !searchQuery ||
        [s.supplierName, s.email].some((f: string) =>
          (f || "").toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const mst =
        selectedStatus === "Select Status" ||
        s.supplierStatus === selectedStatus;
      return ms && mst;
    })
    .sort((a, b) => {
      // Inactive suppliers go to the bottom
      if (a.supplierStatus === "Active" && b.supplierStatus !== "Active")
        return -1;
      if (a.supplierStatus !== "Active" && b.supplierStatus === "Active")
        return 1;
      return 0;
    });

  // ── Role badge color helper ───────────────────────────────────────────
  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      cashier: "bg-blue-100 text-blue-700",
      designer: "bg-pink-100 text-pink-700",
      production: "bg-orange-100 text-orange-700",
      other: "bg-gray-100 text-gray-600",
    };
    return colors[role?.toLowerCase()] || "bg-gray-100 text-gray-600";
  };

  if (loading) return <LoadingSpinner type="table" />;

  return (
    <div className="max-w-7xl mx-auto">


      {/* Employee Deactivate Confirm Modal */}
      <Modal
        show={!!empToDeactivate}
        onClose={() => setEmpToDeactivate(null)}
        title=""
        width="max-w-md">
        <div className="flex items-center gap-3 mb-4 -mt-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Confirm Deactivation</h3>
            <p className="text-sm text-gray-500">
              This will disable the employee record
            </p>
          </div>
        </div>
        {empToDeactivate && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold">{empToDeactivate.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Position:</span>
              <span className="font-semibold">{empToDeactivate.position}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setEmpToDeactivate(null)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleDeactivateEmp}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">
            Deactivate
          </button>
        </div>
      </Modal>

      {/* ═══ CREATE USER MODAL ═══ */}
      <Modal
        show={showCreateUserModal}
        onClose={() => {
          setShowCreateUserModal(false);
          setFormErr("");
        }}
        title="Create Account">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F
            label="First Name"
            value={userForm.firstName}
            onChange={(v: string) => setUserForm({...userForm, firstName: v})}
          />
          <F
            label="Last Name"
            value={userForm.lastName}
            onChange={(v: string) => setUserForm({...userForm, lastName: v})}
          />
          <F
            label="Email *"
            type="email"
            value={userForm.email}
            onChange={(v: string) => setUserForm({...userForm, email: v})}
          />
          <F
            label="Phone"
            value={userForm.phoneNumber}
            onChange={(v: string) => setUserForm({...userForm, phoneNumber: v})}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({...userForm, role: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {accountRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <F
            label="Password *"
            type="password"
            value={userForm.password}
            onChange={(v: string) => setUserForm({...userForm, password: v})}
          />
          <F
            label="Confirm Password *"
            type="password"
            value={userForm.confirmPassword}
            onChange={(v: string) =>
              setUserForm({...userForm, confirmPassword: v})
            }
          />
        </div>
        <ErrBanner msg={formErr} />
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => {
              setShowCreateUserModal(false);
              setFormErr("");
            }}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmitCreateUser}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">
            Create Account
          </button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT USER MODAL ═══ */}
      <Modal
        show={showViewUserModal && !!selectedUser}
        onClose={() => setShowViewUserModal(false)}
        title="Account Info">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F
            label="First Name"
            value={editUserForm.firstName}
            onChange={(v: string) =>
              setEditUserForm({...editUserForm, firstName: v})
            }
          />
          <F
            label="Last Name"
            value={editUserForm.lastName}
            onChange={(v: string) =>
              setEditUserForm({...editUserForm, lastName: v})
            }
          />
          <F
            label="Email"
            type="email"
            value={editUserForm.email}
            onChange={(v: string) =>
              setEditUserForm({...editUserForm, email: v})
            }
          />
          <F
            label="Phone"
            value={editUserForm.phoneNumber}
            onChange={(v: string) =>
              setEditUserForm({...editUserForm, phoneNumber: v})
            }
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role
            </label>
            <select
              value={editUserForm.role}
              onChange={(e) =>
                setEditUserForm({...editUserForm, role: e.target.value})
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              {accountRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowViewUserModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          {selectedUser?.isActive ? (
            <button
              onClick={() => {
                if (selectedUser) {
                  setUserToDeactivate(selectedUser);
                  setShowViewUserModal(false);
                  setShowDeactivateModal(true);
                }
              }}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">
              Deactivate
            </button>
          ) : (
            <span className="px-4 py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl text-sm flex items-center">
              Account Inactive
            </span>
          )}
          <button
            onClick={handleUpdateUser}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} />
            Save
          </button>
        </div>
      </Modal>

      {/* ═══ DEACTIVATE CONFIRM ═══ */}
      <Modal
        show={showDeactivateModal && !!userToDeactivate}
        onClose={() => setShowDeactivateModal(false)}
        title=""
        width="max-w-md">
        <div className="flex items-center gap-3 mb-4 -mt-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Confirm Deactivation</h3>
            <p className="text-sm text-gray-500">
              This will disable the account
            </p>
          </div>
        </div>
        {userToDeactivate && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold">
                {userToDeactivate.firstName} {userToDeactivate.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-semibold">{userToDeactivate.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-semibold">{userToDeactivate.role}</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeactivateModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">
            Deactivate
          </button>
        </div>
      </Modal>

      {/* ═══ CREATE EMPLOYEE MODAL ═══ */}
      <Modal
        show={showCreateEmpModal}
        onClose={() => setShowCreateEmpModal(false)}
        title="Add Employee Record">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F
            label="Employee Code"
            value={empForm.employeeCode}
            onChange={(v: string) => setEmpForm({...empForm, employeeCode: v})}
            placeholder="EMP-008"
          />
          <F
            label="Full Name *"
            value={empForm.fullName}
            onChange={(v: string) => setEmpForm({...empForm, fullName: v})}
          />
          <F
            label="Position *"
            value={empForm.position}
            onChange={(v: string) => setEmpForm({...empForm, position: v})}
            placeholder="e.g., Printer Operator"
          />

          {/* ── NEW: Role dropdown ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={empForm.role}
              onChange={(e) => setEmpForm({...empForm, role: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {employeeRoles.map((r) => (
                <option key={r} value={r.toLowerCase()}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Used for payroll department grouping
            </p>
          </div>

          <F
            label="Daily Rate (₱)"
            type="number"
            value={empForm.baseHourlyRate}
            onChange={(v: string) =>
              setEmpForm({...empForm, baseHourlyRate: v})
            }
            placeholder="0.00"
          />
          <F
            label="Hire Date"
            type="date"
            value={empForm.hireDate}
            onChange={(v: string) => setEmpForm({...empForm, hireDate: v})}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateEmpModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmitCreateEmp}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">
            Add Employee
          </button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT EMPLOYEE MODAL ═══ */}
      <Modal
        show={showViewEmpModal && !!selectedEmployee}
        onClose={() => setShowViewEmpModal(false)}
        title="Employee Record">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F
            label="Employee Code"
            value={selectedEmployee?.employeeCode || ""}
            onChange={() => {}}
            disabled
          />
          <F
            label="Full Name"
            value={editEmpForm.fullName}
            onChange={(v: string) =>
              setEditEmpForm({...editEmpForm, fullName: v})
            }
          />
          <F
            label="Position"
            value={editEmpForm.position}
            onChange={(v: string) =>
              setEditEmpForm({...editEmpForm, position: v})
            }
          />

          {/* ── NEW: Role dropdown ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Role
            </label>
            <select
              value={editEmpForm.role}
              onChange={(e) =>
                setEditEmpForm({...editEmpForm, role: e.target.value})
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {employeeRoles.map((r) => (
                <option key={r} value={r.toLowerCase()}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <F
            label="Daily Rate (₱)"
            type="number"
            value={editEmpForm.baseHourlyRate}
            onChange={(v: string) =>
              setEditEmpForm({...editEmpForm, baseHourlyRate: v})
            }
          />
          <F
            label="Holiday Multiplier"
            type="number"
            value={editEmpForm.holidayMultiplier}
            onChange={(v: string) =>
              setEditEmpForm({...editEmpForm, holidayMultiplier: v})
            }
          />
          <F
            label="Overtime Multiplier"
            type="number"
            value={editEmpForm.overtimeMultiplier}
            onChange={(v: string) =>
              setEditEmpForm({...editEmpForm, overtimeMultiplier: v})
            }
          />
          <F
            label="Hire Date"
            value={selectedEmployee?.hireDate || ""}
            onChange={() => {}}
            disabled
          />
          <F
            label="Status"
            value={selectedEmployee?.isActive ? "Active" : "Inactive"}
            onChange={() => {}}
            disabled
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowViewEmpModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleUpdateEmp}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} />
            Save
          </button>
        </div>
      </Modal>

      {/* ═══ CREATE SUPPLIER MODAL ═══ */}
      <Modal
        show={showCreateSupplierModal}
        onClose={() => setShowCreateSupplierModal(false)}
        title="Add New Supplier"
        width="max-w-lg">
        <div className="space-y-4 mb-6">
          <F
            label="Supplier Name *"
            value={supplierForm.name}
            onChange={(v: string) =>
              setSupplierForm({...supplierForm, name: v})
            }
            placeholder="e.g., ABC Printing Supplies"
          />
          <F
            label="Phone *"
            value={supplierForm.phone}
            onChange={(v: string) =>
              setSupplierForm({...supplierForm, phone: v})
            }
            placeholder="09XX XXX XXXX"
          />
          <F
            label="Email *"
            type="email"
            value={supplierForm.email}
            onChange={(v: string) =>
              setSupplierForm({...supplierForm, email: v})
            }
            placeholder="supplier@example.com"
          />
          <F
            label="Address *"
            value={supplierForm.address}
            onChange={(v: string) =>
              setSupplierForm({...supplierForm, address: v})
            }
            placeholder="Full business address"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateSupplierModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSubmitCreateSupplier}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">
            Add Supplier
          </button>
        </div>
      </Modal>

      <Modal
        show={showSupplierInfoModal && !!selectedSupplier}
        onClose={() => setShowSupplierInfoModal(false)}
        title="Supplier Info">
        {selectedSupplier && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <F
                label="Name *"
                value={editSupplierForm.name}
                onChange={(v: string) => setEditSupplierForm({ ...editSupplierForm, name: v })}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <div
                  className={`px-4 py-2 border rounded-lg text-sm font-semibold ${selectedSupplier.supplierStatus === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {selectedSupplier.supplierStatus}
                </div>
              </div>
              <F
                label="Phone"
                value={editSupplierForm.phone}
                onChange={(v: string) => setEditSupplierForm({ ...editSupplierForm, phone: v })}
              />
              <F
                label="Email"
                type="email"
                value={editSupplierForm.email}
                onChange={(v: string) => setEditSupplierForm({ ...editSupplierForm, email: v })}
              />
              <div className="col-span-2">
                <F
                  label="Address"
                  value={editSupplierForm.address}
                  onChange={(v: string) => setEditSupplierForm({ ...editSupplierForm, address: v })}
                />
              </div>
              {selectedSupplier.isFlagged && (
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-red-600 mb-1">
                    Flag Notes
                  </label>
                  <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {selectedSupplier.flagNotes || "No notes"}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSupplierInfoModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
                Close
              </button>
              <button
                onClick={handleUpdateSupplier}
                className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                <Check size={18} />
                Save
              </button>
              <button
                onClick={() => handleToggleSupplierActive(selectedSupplier)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-xl text-white ${selectedSupplier.supplierStatus === "Active" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}>
                <Power size={16} />
                {selectedSupplier.supplierStatus === "Active"
                  ? "Set Inactive"
                  : "Reactivate"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ═══ FLAG NOTES MODAL ═══ */}
      <Modal
        show={showFlagNotesModal && !!selectedSupplier}
        onClose={() => setShowFlagNotesModal(false)}
        title={`Flag Notes — ${selectedSupplier?.supplierName || ""}`}>
        <textarea
          value={flagNotes}
          onChange={(e) => setFlagNotes(e.target.value)}
          placeholder="Add notes about this supplier..."
          className="w-full min-h-[150px] p-4 bg-gray-100 rounded-lg border-none resize-none focus:outline-none mb-6 text-sm"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSaveFlagNotes}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">
            Save Notes
          </button>
        </div>
      </Modal>

      {/* ═══ MANAGE MATERIALS MODAL ═══ */}
      <Modal
        show={showManageMaterialsModal && !!selectedSupplier}
        onClose={() => setShowManageMaterialsModal(false)}
        title={`Manage Materials — ${selectedSupplier?.supplierName || ""}`}
        width="max-w-3xl">
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Select materials that this supplier provides.
            </p>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter materials..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-xl bg-gray-50">
            {materials
              .filter(m => !materialSearch || 
                m.itemType.toLowerCase().includes(materialSearch.toLowerCase()) || 
                (m.itemVariant || "").toLowerCase().includes(materialSearch.toLowerCase())
              )
              .map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${mappedMaterialIds.includes(m.id) ? "bg-cyan-50 border-cyan-200" : "bg-white border-gray-200 hover:border-cyan-300"}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                  checked={mappedMaterialIds.includes(m.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMappedMaterialIds([...mappedMaterialIds, m.id]);
                    } else {
                      setMappedMaterialIds(
                        mappedMaterialIds.filter((id) => id !== m.id),
                      );
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {m.itemType}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {m.itemVariant || "No variant"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManageMaterialsModal(false)}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleSaveMaterialsMapping}
            disabled={savingMapping}
            className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {savingMapping ? (
              "Saving..."
            ) : (
              <>
                <Check size={18} />
                Save Mapping
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage accounts, employee records, and suppliers
        </p>
      </div>

      {/* TABS */}
      <div className="flex justify-between mb-6 overflow-x-auto pb-2">
        <div className="flex gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery("");
                setSelectedRole("Select Role");
                setSelectedStatus("Select Status");
              }}
              className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab ? "bg-cyan-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {tab.replace(" Management", "")}
            </button>
          ))}
        </div>
        <div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-2.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg">
            Create New
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={
                activeTab.includes("Supplier")
                  ? "Search suppliers..."
                  : activeTab.includes("Employee")
                    ? "Search employees..."
                    : "Search accounts..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {activeTab === "User Account Management" && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 min-w-[150px]">
                <span>{selectedRole}</span>
                <ChevronDown size={16} />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedRole("Select Role");
                      setShowRoleDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    All Roles
                  </button>
                  {accountRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRole(r);
                        setShowRoleDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "Supplier List Management" && (
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 min-w-[150px]">
                <span>{selectedStatus}</span>
                <ChevronDown size={16} />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setSelectedStatus("Select Status");
                      setShowStatusDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    All
                  </button>
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedStatus(s);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ USER ACCOUNTS TABLE ═══ */}
      {activeTab === "User Account Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">User Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              All system login accounts — staff and customers (
              {filteredUsers.length} records)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u: FrontendUser) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === "Admin" ? "bg-purple-100 text-purple-700" : u.role === "Customer" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewUser(u)}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          title="View or Edit">
                          <Eye size={18} className="text-cyan-600" />
                        </button>
                        {u.isActive && (
                          <button
                            onClick={() => {
                              setUserToDeactivate(u);
                              setShowDeactivateModal(true);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg"
                            title="Deactivate">
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ EMPLOYEE RECORDS TABLE ═══ */}
      {activeTab === "Employee List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Employee Records
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              HR records for payroll and record-keeping (
              {filteredEmployees.length} records)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Daily Rate
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Hire Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((e: EmployeeRecord) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {e.employeeCode}
                    </td>
                    <td className="px-4 py-3 font-medium">{e.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{e.position}</td>
                    <td className="px-4 py-3">
                      {(e as any).role ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge((e as any).role)}`}>
                          {(e as any).role}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₱{e.baseHourlyRate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.hireDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${e.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewEmp(e)}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          title="View or Edit">
                          <Eye size={18} className="text-cyan-600" />
                        </button>
                        {e.isActive && (
                          <button
                            onClick={() => setEmpToDeactivate(e)}
                            className="p-1.5 hover:bg-red-100 rounded-lg"
                            title="Deactivate">
                            <Trash2 size={18} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-400">
                      No employee records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SUPPLIERS TABLE ═══ */}
      {activeTab === "Supplier List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage suppliers, contact info, and flags (
              {filteredSuppliers.length} records)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Supplier Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((s: Supplier) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.supplierName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.contactNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${s.supplierStatus === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {s.supplierStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewSupplier(s)}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          title="View or Edit">
                          <Eye size={16} className="text-cyan-600" />
                        </button>
                        <button
                          onClick={() => handleToggleSupplierActive(s)}
                          className={`p-1.5 rounded-lg ${s.supplierStatus === "Active" ? "hover:bg-red-100" : "hover:bg-green-100"}`}
                          title={
                            s.supplierStatus === "Active"
                              ? "Set Inactive"
                              : "Reactivate"
                          }>
                          <Power
                            size={16}
                            className={
                              s.supplierStatus === "Active"
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          />
                        </button>
                        <button
                          onClick={() => handleToggleFlag(s.id)}
                          className={`p-1.5 rounded-lg ${s.isFlagged ? "bg-red-50 hover:bg-red-100" : "hover:bg-red-100"}`}
                          title={s.isFlagged ? "Flagged" : "Flag"}>
                          <Flag
                            size={16}
                            className={
                              s.isFlagged
                                ? "text-red-600 fill-red-600"
                                : "text-gray-500"
                            }
                          />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(s);
                            setFlagNotes(s.flagNotes);
                            setShowFlagNotesModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-200 rounded-lg"
                          title="Notes">
                          <FileText size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleManageMaterials(s)}
                          className="p-1.5 hover:bg-cyan-100 rounded-lg"
                          title="Manage Materials">
                          <Package size={16} className="text-cyan-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400">
                      No suppliers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
