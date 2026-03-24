import { useState } from "react";
import { Search, Eye, Flag, FileText, ChevronDown, X, Check, Trash2 } from "lucide-react";
import { useManagementData } from "../../hooks/useSupabase";
import type { FrontendUser, FrontendSupplier, EmployeeRecord } from "../../Types";

type Supplier = FrontendSupplier;

  // ── Reusable field ───────────────────────────────────────────────────
  const F = ({ label, value, onChange, type = "text", placeholder = "", disabled = false }: any) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e: any) => onChange(e.target.value)} disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100 text-sm" />
    </div>
  );

  // ── Modal wrapper ────────────────────────────────────────────────────
  const Modal = ({ show, onClose, title, children, width = "max-w-2xl" }: any) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className={`bg-white rounded-2xl shadow-2xl ${width} w-full p-8 relative`} onClick={(e: any) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-600" /></button>
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
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", username: "", role: "", password: "", confirmPassword: "" });
  const [editUserForm, setEditUserForm] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "", username: "", role: "" });
  const [empForm, setEmpForm] = useState({ employeeCode: "", fullName: "", position: "", baseHourlyRate: "", hireDate: "" });
  const [editEmpForm, setEditEmpForm] = useState({ fullName: "", position: "", baseHourlyRate: "", holidayMultiplier: "", overtimeMultiplier: "" });
  const [supplierForm, setSupplierForm] = useState({ name: "", phone: "", email: "" });
  const [flagNotes, setFlagNotes] = useState("");

  const tabs = ["User Account Management", "Employee List Management", "Supplier List Management"];
  const accountRoles = ["Admin", "Cashier", "Designer", "Production", "Customer"];
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
      setUserForm({ firstName: "", lastName: "", phoneNumber: "", email: "", username: "", role: "", password: "", confirmPassword: "" });
      setShowCreateUserModal(true);
    } else if (activeTab === "Employee List Management") {
      setEmpForm({ employeeCode: "", fullName: "", position: "", baseHourlyRate: "", hireDate: new Date().toISOString().split('T')[0] });
      setShowCreateEmpModal(true);
    } else {
      setSupplierForm({ name: "", phone: "", email: "" });
      setShowCreateSupplierModal(true);
    }
  };

  // ── User handlers ────────────────────────────────────────────────────
  const handleViewUser = (u: FrontendUser) => {
    setSelectedUser(u);
    setEditUserForm({ firstName: u.firstName, lastName: u.lastName, phoneNumber: u.contactNumber, email: u.email, username: u.userName, role: u.role });
    setShowViewUserModal(true);
  };

  const handleSubmitCreateUser = async () => {
    if (userForm.password !== userForm.confirmPassword) { alert("Passwords do not match"); return; }
    if (!userForm.email || !userForm.password || !userForm.username || !userForm.role) { alert("Fill all required fields (Email, Username, Password, Role)"); return; }
    const r = await createUser({ firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, username: userForm.username, password: userForm.password, role: userForm.role, phoneNumber: userForm.phoneNumber });
    if (r.success) { alert("Account created!"); setShowCreateUserModal(false); } else alert("Error: " + r.error);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const r = await updateUser(selectedUser.id, { firstName: editUserForm.firstName, lastName: editUserForm.lastName, email: editUserForm.email, phoneNumber: editUserForm.phoneNumber, role: editUserForm.role });
    if (r.success) { alert("Account updated!"); setShowViewUserModal(false); } else alert("Error: " + r.error);
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
    setEditEmpForm({ fullName: e.fullName, position: e.position, baseHourlyRate: String(e.baseHourlyRate), holidayMultiplier: String(e.holidayRateMultiplier), overtimeMultiplier: String(e.overtimeRateMultiplier) });
    setShowViewEmpModal(true);
  };

  const handleSubmitCreateEmp = async () => {
    if (!empForm.fullName || !empForm.position) { alert("Full name and position required"); return; }
    const r = await createEmployee({ employeeCode: empForm.employeeCode, fullName: empForm.fullName, position: empForm.position, baseHourlyRate: Number(empForm.baseHourlyRate) || 0, hireDate: empForm.hireDate });
    if (r.success) { alert("Employee record created!"); setShowCreateEmpModal(false); } else alert("Error: " + r.error);
  };

  const handleUpdateEmp = async () => {
    if (!selectedEmployee) return;
    const r = await updateEmployee(selectedEmployee.id, { fullName: editEmpForm.fullName, position: editEmpForm.position, baseHourlyRate: Number(editEmpForm.baseHourlyRate) || 0, holidayMultiplier: Number(editEmpForm.holidayMultiplier) || 2.0, overtimeMultiplier: Number(editEmpForm.overtimeMultiplier) || 1.5 });
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
    const ms = !searchQuery || [u.firstName, u.lastName, u.email, u.userName].some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const mr = selectedRole === "Select Role" || u.role === selectedRole;
    return ms && mr;
  });
  const filteredEmployees = employees.filter(e => !searchQuery || [e.fullName, e.position, e.employeeCode].some(f => f.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredSuppliers = suppliers.filter(s => {
    const ms = !searchQuery || [s.supplierName, s.email].some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const mst = selectedStatus === "Select Status" || s.supplierStatus === selectedStatus;
    return ms && mst;
  });

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) return <div className="max-w-7xl mx-auto flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" /></div>;



  return (
    <div className="max-w-7xl mx-auto">

      {/* ═══ CREATE USER MODAL ═══ */}
      <Modal show={showCreateUserModal} onClose={() => setShowCreateUserModal(false)} title="Create Account">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F label="First Name" value={userForm.firstName} onChange={(v: string) => setUserForm({...userForm, firstName: v})} />
          <F label="Last Name" value={userForm.lastName} onChange={(v: string) => setUserForm({...userForm, lastName: v})} />
          <F label="Email *" type="email" value={userForm.email} onChange={(v: string) => setUserForm({...userForm, email: v})} />
          <F label="Phone" value={userForm.phoneNumber} onChange={(v: string) => setUserForm({...userForm, phoneNumber: v})} />
          <F label="Username *" value={userForm.username} onChange={(v: string) => setUserForm({...userForm, username: v})} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
            <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">Select Role</option>
              {accountRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <F label="Password *" type="password" value={userForm.password} onChange={(v: string) => setUserForm({...userForm, password: v})} />
          <F label="Confirm Password *" type="password" value={userForm.confirmPassword} onChange={(v: string) => setUserForm({...userForm, confirmPassword: v})} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateUserModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmitCreateUser} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Create Account</button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT USER MODAL ═══ */}
      <Modal show={showViewUserModal && !!selectedUser} onClose={() => setShowViewUserModal(false)} title="Account Info">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F label="First Name" value={editUserForm.firstName} onChange={(v: string) => setEditUserForm({...editUserForm, firstName: v})} />
          <F label="Last Name" value={editUserForm.lastName} onChange={(v: string) => setEditUserForm({...editUserForm, lastName: v})} />
          <F label="Email" type="email" value={editUserForm.email} onChange={(v: string) => setEditUserForm({...editUserForm, email: v})} />
          <F label="Phone" value={editUserForm.phoneNumber} onChange={(v: string) => setEditUserForm({...editUserForm, phoneNumber: v})} />
          <F label="Username" value={editUserForm.username} onChange={(v: string) => setEditUserForm({...editUserForm, username: v})} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm, role: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              {accountRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowViewUserModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={() => { if (selectedUser) { setUserToDeactivate(selectedUser); setShowViewUserModal(false); setShowDeactivateModal(true); }}} className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl">Deactivate</button>
          <button onClick={handleUpdateUser} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Check size={18} />Save</button>
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F label="Employee Code" value={empForm.employeeCode} onChange={(v: string) => setEmpForm({...empForm, employeeCode: v})} placeholder="EMP-008" />
          <F label="Full Name *" value={empForm.fullName} onChange={(v: string) => setEmpForm({...empForm, fullName: v})} />
          <F label="Position *" value={empForm.position} onChange={(v: string) => setEmpForm({...empForm, position: v})} placeholder="e.g., Printer Operator" />
          <F label="Base Hourly Rate (₱)" type="number" value={empForm.baseHourlyRate} onChange={(v: string) => setEmpForm({...empForm, baseHourlyRate: v})} placeholder="0.00" />
          <F label="Hire Date" type="date" value={empForm.hireDate} onChange={(v: string) => setEmpForm({...empForm, hireDate: v})} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateEmpModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleSubmitCreateEmp} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Add Employee</button>
        </div>
      </Modal>

      {/* ═══ VIEW/EDIT EMPLOYEE MODAL ═══ */}
      <Modal show={showViewEmpModal && !!selectedEmployee} onClose={() => setShowViewEmpModal(false)} title="Employee Record">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <F label="Employee Code" value={selectedEmployee?.employeeCode || ''} onChange={() => {}} disabled />
          <F label="Full Name" value={editEmpForm.fullName} onChange={(v: string) => setEditEmpForm({...editEmpForm, fullName: v})} />
          <F label="Position" value={editEmpForm.position} onChange={(v: string) => setEditEmpForm({...editEmpForm, position: v})} />
          <F label="Base Hourly Rate (₱)" type="number" value={editEmpForm.baseHourlyRate} onChange={(v: string) => setEditEmpForm({...editEmpForm, baseHourlyRate: v})} />
          <F label="Holiday Multiplier" type="number" value={editEmpForm.holidayMultiplier} onChange={(v: string) => setEditEmpForm({...editEmpForm, holidayMultiplier: v})} />
          <F label="Overtime Multiplier" type="number" value={editEmpForm.overtimeMultiplier} onChange={(v: string) => setEditEmpForm({...editEmpForm, overtimeMultiplier: v})} />
          <F label="Hire Date" value={selectedEmployee?.hireDate || ''} onChange={() => {}} disabled />
          <F label="Status" value={selectedEmployee?.isActive ? 'Active' : 'Inactive'} onChange={() => {}} disabled />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowViewEmpModal(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl">Cancel</button>
          <button onClick={handleUpdateEmp} className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Check size={18} />Save</button>
        </div>
      </Modal>

      {/* ═══ CREATE SUPPLIER MODAL ═══ */}
      <Modal show={showCreateSupplierModal} onClose={() => setShowCreateSupplierModal(false)} title="Add New Supplier" width="max-w-lg">
        <div className="space-y-4 mb-6">
          <F label="Supplier Name *" value={supplierForm.name} onChange={(v: string) => setSupplierForm({...supplierForm, name: v})} placeholder="e.g., ABC Printing Supplies" />
          <F label="Phone" value={supplierForm.phone} onChange={(v: string) => setSupplierForm({...supplierForm, phone: v})} placeholder="09XX XXX XXXX" />
          <F label="Email" type="email" value={supplierForm.email} onChange={(v: string) => setSupplierForm({...supplierForm, email: v})} />
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
            <div className="grid grid-cols-2 gap-4 mb-6">
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
        <textarea value={flagNotes} onChange={e => setFlagNotes(e.target.value)} placeholder="Add notes about this supplier..." className="w-full min-h-[150px] p-4 bg-gray-100 rounded-lg border-none resize-none focus:outline-none mb-6 text-sm" />
        <div className="flex justify-end"><button onClick={handleSaveFlagNotes} className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl">Save Notes</button></div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage accounts, employee records, and suppliers</p>
      </div>

      <div className="flex justify-end gap-3 mb-6">
        <button onClick={handleCreateNew} className="px-6 py-2.5 bg-white border-2 border-gray-900 hover:bg-gray-50 text-gray-900 font-semibold rounded-lg">Create New</button>
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder={activeTab.includes("Supplier") ? "Search suppliers..." : activeTab.includes("Employee") ? "Search employees..." : "Search accounts..."}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          </div>
          {activeTab === "User Account Management" && (
            <div className="relative">
              <button onClick={() => setShowRoleDropdown(!showRoleDropdown)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 min-w-[150px]"><span>{selectedRole}</span><ChevronDown size={16} /></button>
              {showRoleDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                  <button onClick={() => { setSelectedRole("Select Role"); setShowRoleDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">All Roles</button>
                  {accountRoles.map(r => <button key={r} onClick={() => { setSelectedRole(r); setShowRoleDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">{r}</button>)}
                </div>
              )}
            </div>
          )}
          {activeTab === "Supplier List Management" && (
            <div className="relative">
              <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center gap-2 min-w-[150px]"><span>{selectedStatus}</span><ChevronDown size={16} /></button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                  <button onClick={() => { setSelectedStatus("Select Status"); setShowStatusDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">All</button>
                  {statuses.map(s => <button key={s} onClick={() => { setSelectedStatus(s); setShowStatusDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">{s}</button>)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ USER ACCOUNTS TABLE ═══ */}
      {activeTab === "User Account Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">User Accounts</h2><p className="text-sm text-gray-500 mt-1">All system login accounts — staff and customers ({filteredUsers.length} records)</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.userName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.contactNumber || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-gray-600">{u.createdAt}</td>
                    <td className="px-4 py-3 text-center"><button onClick={() => handleViewUser(u)} className="p-1.5 hover:bg-cyan-100 rounded-lg"><Eye size={18} className="text-cyan-600" /></button></td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No accounts found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ EMPLOYEE RECORDS TABLE ═══ */}
      {activeTab === "Employee List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">Employee Records</h2><p className="text-sm text-gray-500 mt-1">HR records for payroll and record-keeping ({filteredEmployees.length} records)</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Position</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Hourly Rate</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Hire Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.employeeCode}</td>
                    <td className="px-4 py-3 font-medium">{e.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{e.position}</td>
                    <td className="px-4 py-3 text-right font-semibold">₱{e.baseHourlyRate.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{e.hireDate}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3 text-center"><button onClick={() => handleViewEmp(e)} className="p-1.5 hover:bg-cyan-100 rounded-lg"><Eye size={18} className="text-cyan-600" /></button></td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No employee records found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SUPPLIERS TABLE ═══ */}
      {activeTab === "Supplier List Management" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-900">Suppliers</h2><p className="text-sm text-gray-500 mt-1">Manage suppliers, contact info, and flags ({filteredSuppliers.length} records)</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Supplier Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.supplierName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.contactNumber || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.supplierStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.supplierStatus}</span></td>
                    <td className="px-4 py-3 text-gray-600">{s.createdAt}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewSupplier(s)} className="p-1.5 hover:bg-cyan-100 rounded-lg" title="View"><Eye size={16} className="text-cyan-600" /></button>
                        <button onClick={() => handleToggleFlag(s.id)} className={`p-1.5 rounded-lg ${s.isFlagged ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-red-100'}`} title={s.isFlagged ? 'Flagged' : 'Flag'}>
                          <Flag size={16} className={s.isFlagged ? 'text-red-600 fill-red-600' : 'text-gray-500'} />
                        </button>
                        <button onClick={() => { setSelectedSupplier(s); setFlagNotes(s.flagNotes); setShowFlagNotesModal(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Notes"><FileText size={16} className="text-gray-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No suppliers found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;