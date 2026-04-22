import { useState } from "react";
import { Search, Eye, Flag, FileText, ChevronDown, X, Check, Trash2 } from "lucide-react";
import { useManagementData } from "../../hooks/useSupabase";
import { LoadingSpinner } from "../Shared/UI/LoadingSpinner";
import { PageHeader } from "../Shared/UI/PageHeader";
import { getRoleColor } from "../../util/formatters";
import type { FrontendUser, FrontendSupplier, EmployeeRecord, UserRole } from "../../Types";

type Supplier = FrontendSupplier;

// ── Reusable field ───────────────────────────────────────────────────
const F = ({ label, value, onChange, type = "text", placeholder = "", disabled = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input type={type} placeholder={placeholder} value={value} onChange={(e: any) => onChange(e.target.value)} disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-sm" />
  </div>
);

// ── Reusable select ──────────────────────────────────────────────────
const S = ({ label, value, onChange, options, placeholder = "Select...", disabled = false }: any) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <select value={value} onChange={(e: any) => onChange(e.target.value)} disabled={disabled}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-sm bg-white">
      <option value="">{placeholder}</option>
      {options.map((o: string) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
    </select>
  </div>
);

// ── Modal wrapper ────────────────────────────────────────────────────
const Modal = ({ show, onClose, title, children, width = "max-w-2xl" }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-3xl shadow-2xl ${width} w-full p-6 md:p-10 relative overflow-y-auto max-h-[90vh]`} onClick={(e: any) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} className="text-gray-400" /></button>
        <h3 className="text-2xl font-bold text-gray-900 mb-8">{title}</h3>
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

  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCreateEmpModal, setShowCreateEmpModal] = useState(false);
  const [showViewEmpModal, setShowViewEmpModal] = useState(false);
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false);
  const [showSupplierInfoModal, setShowSupplierInfoModal] = useState(false);
  const [showFlagNotesModal, setShowFlagNotesModal] = useState(false);

  // Selected items
  const [selectedUser, setSelectedUser] = useState<FrontendUser | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<FrontendUser | null>(null);

  // Forms
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", role: "", password: "", confirmPassword: "" });
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", role: "" });
  const [empForm, setEmpForm] = useState({ employeeCode: "", fullName: "", position: "", role: "production" as UserRole, baseHourlyRate: "", hireDate: "" });
  const [editEmpForm, setEditEmpForm] = useState({ fullName: "", position: "", role: "" as UserRole, baseHourlyRate: "", holidayMultiplier: "", overtimeMultiplier: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", email: "" });
  const [flagNotes, setFlagNotes] = useState("");

  const tabs = ["User Account Management", "Employee List Management", "Supplier List Management"];
  const accountRoles = ["Admin", "Cashier", "Designer", "Production", "Customer"];
  const employeeRoles = ["Admin", "Cashier", "Designer", "Production"];
  const statuses = ["Active", "Inactive"];

  const {
    users, employees, suppliers, loading,
    createUser, updateUser, deactivateUsers,
    createEmployee, updateEmployee, deactivateEmployee,
    createSupplier, flagSupplier,
  } = useManagementData();

  // ── Context-aware Create New ─────────────────────────────────────────
  const handleCreateNew = () => {
    if (activeTab === "User Account Management") {
      setUserForm({ firstName: "", lastName: "", phoneNumber: "", email: "", role: "", password: "", confirmPassword: "" });
      setShowCreateUserModal(true);
    } else if (activeTab === "Employee List Management") {
      setEmpForm({ employeeCode: "", fullName: "", position: "", role: "production" as UserRole, baseHourlyRate: "", hireDate: new Date().toISOString().split('T')[0] });
      setShowCreateEmpModal(true);
    } else {
      setSupplierForm({ name: "", phone: "", email: "" });
      setShowCreateSupplierModal(true);
    }
  };

  // ── User handlers ────────────────────────────────────────────────────
  const handleViewUser = (u: FrontendUser) => {
    setSelectedUser(u);
    setEditUserForm({ firstName: u.firstName, lastName: u.lastName, phoneNumber: u.contactNumber, email: u.email, role: u.role });
    setShowViewUserModal(true);
  };

  const handleSubmitCreateUser = async () => {
    if (userForm.password !== userForm.confirmPassword) { alert("Passwords do not match"); return; }
    if (!userForm.email || !userForm.password || !userForm.role) { alert("Fill all required fields (Email, Password, Role)"); return; }
    const r = await createUser({ firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, password: userForm.password, role: userForm.role, phoneNumber: userForm.phoneNumber });
    if (r.success) { alert("Account created!"); setShowCreateUserModal(false); } else alert("Error: " + r.error);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const r = await updateUser(selectedUser.id, { 
      firstName: editUserForm.firstName, 
      lastName: editUserForm.lastName, 
      email: editUserForm.email, 
      phoneNumber: editUserForm.phoneNumber, 
      role: editUserForm.role 
    });
    if (r.success) { 
      alert("Account updated!"); 
      setShowViewUserModal(false); 
      // Important: refresh is handled by hook
    } else {
      alert("Error: " + r.error);
    }
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    const r = await deactivateUsers([userToDeactivate.id]);
    if (r.success) alert(`${userToDeactivate.firstName} ${userToDeactivate.lastName} deactivated`);
    else alert("Error: " + r.error);
    setShowDeactivateModal(false); setUserToDeactivate(null);
  };

  // ── Employee handlers ────────────────────────────────────────────────
  const handleViewEmp = (e: EmployeeRecord) => {
    setSelectedEmployee(e);
    setEditEmpForm({ fullName: e.fullName, position: e.position, role: e.role, baseHourlyRate: String(e.baseHourlyRate), holidayMultiplier: String(e.holidayRateMultiplier), overtimeMultiplier: String(e.overtimeRateMultiplier) });
    setShowViewEmpModal(true);
  };

  const handleSubmitCreateEmp = async () => {
    if (!empForm.fullName || !empForm.position) { alert("Full name and position are required"); return; }
    if (!empForm.role) { alert("Role is required — select Cashier, Designer, Production, Admin, or Other"); return; }
    const r = await createEmployee({
      employeeCode: empForm.employeeCode,
      fullName: empForm.fullName,
      position: empForm.position,
      role: empForm.role as import('../../Types').EmployeeRole,
      baseHourlyRate: Number(empForm.baseHourlyRate) || 0,
      hireDate: empForm.hireDate,
    });
    if (r.success) { alert("Employee record created!"); setShowCreateEmpModal(false); }
    else alert("Error: " + r.error);
  };

  const handleUpdateEmp = async () => {
    if (!selectedEmployee) return;
    const r = await updateEmployee(selectedEmployee.id, { fullName: editEmpForm.fullName, position: editEmpForm.position, role: editEmpForm.role, baseHourlyRate: Number(editEmpForm.baseHourlyRate) || 0, holidayMultiplier: Number(editEmpForm.holidayMultiplier) || 2.0, overtimeMultiplier: Number(editEmpForm.overtimeMultiplier) || 1.5 });
    if (r.success) { alert("Employee updated!"); setShowViewEmpModal(false); } else alert("Error: " + r.error);
  };

  // ── Supplier handlers ────────────────────────────────────────────────
  const handleViewSupplier = (s: Supplier) => { setSelectedSupplier(s); setShowSupplierInfoModal(true); };

  const handleSubmitCreateSupplier = async () => {
    if (!supplierForm.name.trim()) { alert("Supplier name required"); return; }
    const r = await createSupplier({ name: supplierForm.name, phone: supplierForm.phone, email: supplierForm.email });
    if (r.success) { alert("Supplier created!"); setShowCreateSupplierModal(false); } else alert("Error: " + r.error);
  };

  const handleToggleFlag = async (id: string) => {
    const s = suppliers.find(x => x.id === id);
    if (!s) return;
    await flagSupplier(id, !s.isFlagged, !s.isFlagged ? 'Flagged by admin' : '');
  };

  const handleSaveFlagNotes = async () => {
    if (!selectedSupplier) return;
    const r = await flagSupplier(selectedSupplier.id, true, flagNotes);
    if (r.success) alert("Notes saved!"); else alert("Error: " + r.error);
    setShowFlagNotesModal(false);
  };

  // ── Filtering ────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const ms = !searchQuery || [u.firstName, u.lastName, u.email].some((f: string) => (f || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const mr = selectedRole === "Select Role" || u.role === selectedRole;
    return ms && mr;
  }).sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return 0;
  });
  const filteredEmployees = employees.filter(e =>
    !searchQuery || [e.fullName, e.position, e.employeeCode, (e as any).role || ''].some((f: string) => (f || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredSuppliers = suppliers.filter(s => {
    const ms = !searchQuery || [s.supplierName, s.email].some((f: string) => (f || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const mst = selectedStatus === "Select Status" || s.supplierStatus === selectedStatus;
    return ms && mst;
  });

  const roleBadge = getRoleColor;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto">

      {/* ═══ CREATE USER MODAL ═══ */}
      <Modal show={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} title="Create Account">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <F label="First Name" value={userForm.firstName} onChange={(v: string) => setUserForm({ ...userForm, firstName: v })} />
          <F label="Last Name" value={userForm.lastName} onChange={(v: string) => setUserForm({ ...userForm, lastName: v })} />
          <F label="Email *" type="email" value={userForm.email} onChange={(v: string) => setUserForm({ ...userForm, email: v })} />
          <F label="Phone" value={userForm.phoneNumber} onChange={(v: string) => setUserForm({ ...userForm, phoneNumber: v })} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {accountRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <F label="Password *" type="password" value={userForm.password} onChange={(v: string) => setUserForm({ ...userForm, password: v })} />
          <F label="Confirm Password *" type="password" value={userForm.confirmPassword} onChange={(v: string) => setUserForm({ ...userForm, confirmPassword: v })} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateUserModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmitCreateUser} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Create Account</button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT USER MODAL ═══ */}
      <Modal show={showViewUserModal && !!selectedUser} onClose={() => setShowViewUserModal(false)} title="Account Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <F label="First Name" value={editUserForm.firstName} onChange={(v: string) => setEditUserForm({ ...editUserForm, firstName: v })} />
          <F label="Last Name" value={editUserForm.lastName} onChange={(v: string) => setEditUserForm({ ...editUserForm, lastName: v })} />
          <F label="Email" type="email" value={editUserForm.email} onChange={(v: string) => setEditUserForm({ ...editUserForm, email: v })} />
          <F label="Phone" value={editUserForm.phoneNumber} onChange={(v: string) => setEditUserForm({ ...editUserForm, phoneNumber: v })} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select value={editUserForm.role} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              {accountRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowViewUserModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          {selectedUser?.isActive && (
            <button 
              onClick={() => { 
                if (selectedUser) { 
                  setUserToDeactivate(selectedUser); 
                  setShowViewUserModal(false); 
                  setShowDeactivateModal(true); 
                } 
              }}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl"
            >
              Deactivate
            </button>
          )}
          <button onClick={handleUpdateUser} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} />Save
          </button>
        </div>
      </Modal>

      {/* ═══ DEACTIVATE CONFIRM ═══ */}
      <Modal show={showDeactivateModal && !!userToDeactivate} onClose={() => setShowDeactivateModal(false)} title="" width="max-w-md">
        <div className="flex items-center gap-3 mb-4 -mt-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={24} className="text-red-600" /></div>
          <div><h3 className="text-xl font-bold">Confirm Deactivation</h3><p className="text-sm text-gray-500">This will disable the account</p></div>
        </div>
        {userToDeactivate && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Name:</span><span className="font-semibold">{userToDeactivate.firstName} {userToDeactivate.lastName}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-semibold">{userToDeactivate.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Role:</span><span className="font-semibold">{userToDeactivate.role}</span></div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setShowDeactivateModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleDeactivate} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">Deactivate</button>
        </div>
      </Modal>

      {/* ═══ CREATE EMPLOYEE MODAL ═══ */}
      <Modal show={showCreateEmpModal} onClose={() => setShowCreateEmpModal(false)} title="Add Employee Record">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <F label="Employee Code" value={empForm.employeeCode} onChange={(v: string) => setEmpForm({ ...empForm, employeeCode: v })} placeholder="EMP-008" />
          <F label="Full Name *" value={empForm.fullName} onChange={(v: string) => setEmpForm({ ...empForm, fullName: v })} />
          <F label="Position *" value={empForm.position} onChange={(v: string) => setEmpForm({ ...empForm, position: v })} placeholder="e.g., Printer Operator" />

          {/* ── NEW: Role dropdown ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
            <select value={empForm.role} onChange={e => setEmpForm({ ...empForm, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {employeeRoles.map(r => (
                <option key={r} value={r.toLowerCase()}>{r}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Used for payroll department grouping</p>
          </div>

          <F label="Daily Rate (₱)" type="number" value={empForm.baseHourlyRate} onChange={(v: string) => setEmpForm({ ...empForm, baseHourlyRate: v })} placeholder="0.00" />
          <F label="Hire Date" type="date" value={empForm.hireDate} onChange={(v: string) => setEmpForm({ ...empForm, hireDate: v })} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateEmpModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmitCreateEmp} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Add Employee</button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT EMPLOYEE MODAL ═══ */}
      <Modal show={showViewEmpModal && !!selectedEmployee} onClose={() => setShowViewEmpModal(false)} title="Employee Record">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <F label="Employee Code" value={selectedEmployee?.employeeCode || ''} onChange={() => { }} disabled />
          <F label="Full Name" value={editEmpForm.fullName} onChange={(v: string) => setEditEmpForm({ ...editEmpForm, fullName: v })} />
          <F label="Position" value={editEmpForm.position} onChange={(v: string) => setEditEmpForm({ ...editEmpForm, position: v })} />

          {/* ── NEW: Role dropdown ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select value={editEmpForm.role} onChange={e => setEditEmpForm({ ...editEmpForm, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Select Role</option>
              {employeeRoles.map(r => (
                <option key={r} value={r.toLowerCase()}>{r}</option>
              ))}
            </select>
          </div>

          <F label="Daily Rate (₱)" type="number" value={editEmpForm.baseHourlyRate} onChange={(v: string) => setEditEmpForm({ ...editEmpForm, baseHourlyRate: v })} />
          <F label="Holiday Multiplier" type="number" value={editEmpForm.holidayMultiplier} onChange={(v: string) => setEditEmpForm({ ...editEmpForm, holidayMultiplier: v })} />
          <F label="Overtime Multiplier" type="number" value={editEmpForm.overtimeMultiplier} onChange={(v: string) => setEditEmpForm({ ...editEmpForm, overtimeMultiplier: v })} />
          <F label="Hire Date" value={selectedEmployee?.hireDate || ''} onChange={() => { }} disabled />
          <F label="Status" value={selectedEmployee?.isActive ? 'Active' : 'Inactive'} onChange={() => { }} disabled />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowViewEmpModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleUpdateEmp} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} />Save
          </button>
        </div>
      </Modal>

      {/* ═══ CREATE SUPPLIER MODAL ═══ */}
      <Modal show={showCreateSupplierModal} onClose={() => setShowCreateSupplierModal(false)} title="Add New Supplier" width="max-w-lg">
        <div className="space-y-4 mb-6">
          <F label="Supplier Name *" value={supplierForm.name} onChange={(v: string) => setSupplierForm({ ...supplierForm, name: v })} placeholder="e.g., ABC Printing Supplies" />
          <F label="Phone" value={supplierForm.phone} onChange={(v: string) => setSupplierForm({ ...supplierForm, phone: v })} placeholder="09XX XXX XXXX" />
          <F label="Email" type="email" value={supplierForm.email} onChange={(v: string) => setSupplierForm({ ...supplierForm, email: v })} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateSupplierModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmitCreateSupplier} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Add Supplier</button>
        </div>
      </Modal>

      {/* ═══ SUPPLIER INFO MODAL ═══ */}
      <Modal show={showSupplierInfoModal && !!selectedSupplier} onClose={() => setShowSupplierInfoModal(false)} title="Supplier Info">
        {selectedSupplier && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Name</label><div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm">{selectedSupplier.supplierName}</div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Status</label><div className={`px-4 py-2 border rounded-lg text-sm ${selectedSupplier.supplierStatus === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{selectedSupplier.supplierStatus}</div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label><div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm">{selectedSupplier.contactNumber || '—'}</div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Email</label><div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm">{selectedSupplier.email || '—'}</div></div>
              <div className="col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-1">Address</label><div className="px-4 py-2 bg-gray-50 border rounded-lg text-sm">{selectedSupplier.address || '—'}</div></div>
              {selectedSupplier.isFlagged && <div className="col-span-2"><label className="block text-sm font-semibold text-red-600 mb-1">Flag Notes</label><div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{selectedSupplier.flagNotes || 'No notes'}</div></div>}
            </div>
            <button onClick={() => setShowSupplierInfoModal(false)} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Close</button>
          </>
        )}
      </Modal>

      {/* ═══ FLAG NOTES MODAL ═══ */}
      <Modal show={showFlagNotesModal && !!selectedSupplier} onClose={() => setShowFlagNotesModal(false)} title={`Flag Notes — ${selectedSupplier?.supplierName || ''}`}>
        <textarea value={flagNotes} onChange={e => setFlagNotes(e.target.value)} placeholder="Add notes about this supplier..."
          className="w-full min-h-[150px] p-4 bg-gray-100 rounded-lg border-none resize-none focus:outline-none mb-6 text-sm" />
        <div className="flex justify-end">
          <button onClick={handleSaveFlagNotes} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Save Notes</button>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage accounts, employee records, and suppliers</p>
        </div>
        <button onClick={handleCreateNew} 
          className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg shadow-gray-200 transition-all active:scale-95">
          Create New Record
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(""); setSelectedRole("Select Role"); setSelectedStatus("Select Status"); }}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab ? "bg-cyan-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {tab.replace(" Management", "")}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text"
              placeholder={activeTab.includes("Supplier") ? "Search suppliers..." : activeTab.includes("Employee") ? "Search employees..." : "Search accounts..."}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-cyan-500 transition-all" />
          </div>
          <div className="flex gap-2">
            {activeTab === "User Account Management" && (
              <div className="flex-1 md:flex-none relative">
                <button onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none flex items-center justify-between gap-2 min-w-[140px] font-semibold text-gray-700">
                  <span>{selectedRole}</span><ChevronDown size={16} />
                </button>
                {showRoleDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                    <button onClick={() => { setSelectedRole("Select Role"); setShowRoleDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors">All Roles</button>
                    {accountRoles.map(r => <button key={r} onClick={() => { setSelectedRole(r); setShowRoleDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-t border-gray-50">{r}</button>)}
                  </div>
                )}
              </div>
            )}
            {activeTab === "Supplier List Management" && (
              <div className="flex-1 md:flex-none relative">
                <button onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none flex items-center justify-between gap-2 min-w-[140px] font-semibold text-gray-700">
                  <span>{selectedStatus}</span><ChevronDown size={16} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                    <button onClick={() => { setSelectedStatus("Select Status"); setShowStatusDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors">All Statuses</button>
                    {statuses.map(s => <button key={s} onClick={() => { setSelectedStatus(s); setShowStatusDropdown(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-t border-gray-50">{s}</button>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ USER ACCOUNTS TABLE ═══ */}
      {activeTab === "User Account Management" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">User Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">All system login accounts — staff and customers ({filteredUsers.length} records)</p>
          </div>

          {/* MOBILE VIEW — CARDS */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredUsers.map((u: FrontendUser) => (
              <div key={u.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewUser(u)} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Eye size={18} /></button>
                    {u.isActive && <button onClick={() => { setUserToDeactivate(u); setShowDeactivateModal(true); }} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={18} /></button>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {u.role}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="ml-auto text-[10px] text-gray-400 font-medium">Joined {u.createdAt}</span>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <div className="p-10 text-center text-gray-400 text-sm italic">No accounts found</div>}
          </div>

          {/* DESKTOP VIEW — TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Name</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Email</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Contact</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Role</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Status</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Created</th>
                <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase tracking-tight text-xs">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u: FrontendUser) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-5 py-4 text-gray-600">{u.email}</td>
                    <td className="px-5 py-4 text-gray-600">{u.contactNumber || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-medium">{u.createdAt}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewUser(u)} className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-xl transition-colors" title="View/Edit">
                          <Eye size={20} />
                        </button>
                        {u.isActive && (
                          <button onClick={() => { setUserToDeactivate(u); setShowDeactivateModal(true); }} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors" title="Deactivate">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={8} className="px-5 py-20 text-center text-gray-400 italic">No accounts found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ EMPLOYEE RECORDS TABLE ═══ */}
      {activeTab === "Employee List Management" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Employee Records</h2>
            <p className="text-sm text-gray-500 mt-1">HR records for payroll and record-keeping ({filteredEmployees.length} records)</p>
          </div>

          {/* MOBILE VIEW — CARDS */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredEmployees.map((e: EmployeeRecord) => (
              <div key={e.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{e.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{e.position}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewEmp(e)} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Eye size={18} /></button>
                    {e.isActive && (
                      <button onClick={async () => { if (window.confirm(`Deactivate ${e.fullName}?`)) await deactivateEmployee(e.id); }} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={18} /></button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 font-mono">
                    {e.employeeCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                    {e.role}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 border-t border-gray-50 pt-2">
                  <span className="text-gray-500">Rate: <span className="font-bold text-gray-900">₱{e.baseHourlyRate.toFixed(2)}/day</span></span>
                  <span className="text-gray-400">Hired {e.hireDate}</span>
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && <div className="p-10 text-center text-gray-400 text-sm italic">No employee records found</div>}
          </div>

          {/* DESKTOP VIEW — TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Code</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Full Name</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Position</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Role</th>
                <th className="px-5 py-4 text-right font-bold text-gray-700 uppercase tracking-tight text-xs">Daily Rate</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Hire Date</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Status</th>
                <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase tracking-tight text-xs">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((e: EmployeeRecord) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{e.employeeCode}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{e.fullName}</td>
                    <td className="px-5 py-4 text-gray-600">{e.position}</td>
                    <td className="px-5 py-4"><span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">{e.role}</span></td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">₱{e.baseHourlyRate.toFixed(2)}</td>
                    <td className="px-5 py-4 text-gray-500 font-medium">{e.hireDate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {e.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewEmp(e)} className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-xl transition-colors" title="View/Edit">
                          <Eye size={20} />
                        </button>
                        {e.isActive && (
                          <button onClick={async () => {
                            if (window.confirm(`Deactivate ${e.fullName}?`)) await deactivateEmployee(e.id);
                          }} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors" title="Deactivate">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && <tr><td colSpan={8} className="px-5 py-20 text-center text-gray-400 italic">No employee records found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SUPPLIERS TABLE ═══ */}
      {activeTab === "Supplier List Management" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
            <p className="text-sm text-gray-500 mt-1">Manage suppliers, contact info, and flags ({filteredSuppliers.length} records)</p>
          </div>

          {/* MOBILE VIEW — CARDS */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredSuppliers.map((s: Supplier) => (
              <div key={s.id} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate flex items-center gap-2">
                       {s.supplierName}
                       {s.isFlagged && <Flag size={14} className="text-red-500 fill-red-500" />}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{s.email || s.contactNumber || 'No contact info'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewSupplier(s)} className="p-2 bg-cyan-50 text-cyan-600 rounded-lg"><Eye size={18} /></button>
                    <button onClick={() => { setSelectedSupplier(s); setFlagNotes(s.flagNotes); setShowFlagNotesModal(true); }} className="p-2 bg-gray-50 text-gray-600 rounded-lg"><FileText size={18} /></button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.supplierStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.supplierStatus}
                  </span>
                  <button onClick={() => handleToggleFlag(s.id)} className="text-[10px] text-gray-500 font-bold uppercase tracking-wider underline hover:text-gray-700">
                     {s.isFlagged ? 'Unflag' : 'Flag'}
                  </button>
                </div>
              </div>
            ))}
            {filteredSuppliers.length === 0 && <div className="p-10 text-center text-gray-400 text-sm italic">No suppliers found</div>}
          </div>

          {/* DESKTOP VIEW — TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Supplier Name</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Email</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Phone</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Status</th>
                <th className="px-5 py-4 text-left font-bold text-gray-700 uppercase tracking-tight text-xs">Created</th>
                <th className="px-5 py-4 text-center font-bold text-gray-700 uppercase tracking-tight text-xs">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSuppliers.map((s: Supplier) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900 flex items-center gap-2">
                      {s.supplierName}
                      {s.isFlagged && <div className="w-2 h-2 rounded-full bg-red-500" title="Flagged" />}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{s.email || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{s.contactNumber || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${s.supplierStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.supplierStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-medium">{s.createdAt}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewSupplier(s)} className="p-2 hover:bg-cyan-50 text-cyan-600 rounded-xl transition-colors" title="View"><Eye size={20} /></button>
                        <button onClick={() => handleToggleFlag(s.id)} className={`p-2 rounded-xl transition-colors ${s.isFlagged ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-red-50'}`} title={s.isFlagged ? 'Unflag' : 'Flag'}>
                          <Flag size={20} className={s.isFlagged ? 'text-red-600 fill-red-600' : 'text-gray-400'} />
                        </button>
                        <button onClick={() => { setSelectedSupplier(s); setFlagNotes(s.flagNotes); setShowFlagNotesModal(true); }} className="p-2 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors" title="Notes">
                          <FileText size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && <tr><td colSpan={6} className="px-5 py-20 text-center text-gray-400 italic">No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;