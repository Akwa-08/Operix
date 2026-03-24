// frontend/src/components/Admin/AdminProfile.tsx
// Uses db.getMyProfile() + db.updateMyProfile() — no Express apiClient needed.
// Password changes use authService.updatePassword() via Supabase Auth.

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { db } from '../../lib/database';

const AdminProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load profile from Supabase (RLS: users_read_own + users_staff_read_all) ──
  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await db.getMyProfile();
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setEmail(profile.email || '');
        setPhoneNumber(profile.contact_number || '');
        setAddress(profile.address || '');
      }
    } catch (err: any) {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []);

  const fullName = `${firstName} ${lastName}`.trim() || 'Admin';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Admin';

  // ── Save profile via db.updateMyProfile (RLS: users_update_own) ──
  const handleSaveProfile = async () => {
    if (!firstName.trim()) return toast.error("First name is required");
    if (!email.includes("@")) return toast.error("Enter a valid email");

    setIsProfileSaving(true);
    try {
      await db.updateMyProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: phoneNumber,
        address,
      });
      await refreshUser();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
    setIsProfileSaving(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadProfile();
  };

  // ── Save password (via Supabase Auth directly) ──
  const handlePasswordSave = async () => {
    if (!newPassword || !confirmPassword) return toast.error("All password fields are required");
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setIsPasswordSaving(true);
    const result = await authService.updatePassword(newPassword);
    setIsPasswordSaving(false);

    if (result.success) {
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setShowNew(false);
      setShowConfirm(false);
    } else {
      toast.error(result.error || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto mt-6 px-6">
      <div className="text-4xl font-bold mb-8">{roleLabel} Account</div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-wide">Personal Information</h2>
          <div className="flex gap-4">
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              disabled={isProfileSaving}
              className="bg-[#00BEF4] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-600 transition disabled:opacity-50"
            >
              {isProfileSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-full bg-[#00BEF4] flex items-center justify-center text-white text-3xl font-bold shadow-sm">
            {firstName ? firstName.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="font-bold text-2xl">{fullName}</h3>
            <p className="text-gray-500 text-medium tracking-wide">{roleLabel}</p>
          </div>
        </div>

        <hr className="border-t border-black my-8" />

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <InputField label="First Name" icon={<User size={18} />} value={firstName} onChange={setFirstName} disabled={!isEditing} />
          <InputField label="Last Name" icon={<User size={18} />} value={lastName} onChange={setLastName} disabled={!isEditing} />
          <InputField label="Email Address" icon={<Mail size={18} />} value={email} onChange={setEmail} disabled={!isEditing} />
          <InputField label="Phone Number" icon={<Phone size={18} />} value={phoneNumber} onChange={setPhoneNumber} disabled={!isEditing} />

          <div>
            <label className="text-sm font-semibold text-gray-600 tracking-wide">Role</label>
            <input value={roleLabel} disabled className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100" />
          </div>

          <InputField label="Address" icon={<MapPin size={18} />} value={address} onChange={setAddress} disabled={!isEditing} />
        </div>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="text-[#00BEF4] font-semibold text-sm hover:underline"
        >
          Change Password
        </button>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-10 w-[450px] shadow-xl">
              <h3 className="text-xl font-semibold mb-8">Change Password</h3>

              <PasswordField label="New Password" value={newPassword} setValue={setNewPassword} show={showNew} setShow={setShowNew} />
              <PasswordField label="Confirm New Password" value={confirmPassword} setValue={setConfirmPassword} show={showConfirm} setShow={setShowConfirm} />

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSave}
                  disabled={isPasswordSaving}
                  className="bg-[#00BEF4] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-600 transition disabled:opacity-50"
                >
                  {isPasswordSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;

/* ---------- Input Field ---------- */
const InputField = ({ label, icon, value, onChange, disabled }: any) => (
  <div>
    <label className="text-sm font-semibold text-black-600 tracking-wide">{label}</label>
    <div className="relative mt-2">
      <div className="absolute left-4 top-3 text-gray-400">{icon}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BEF4] focus:border-[#00BEF4] transition disabled:bg-gray-100"
      />
    </div>
  </div>
);

/* ---------- Password Field ---------- */
const PasswordField = ({ label, value, setValue, show, setShow }: any) => (
  <div className="mb-6">
    <label className="text-sm font-semibold text-gray-600 tracking-wide">{label}</label>
    <div className="relative mt-2">
      <Lock className="absolute left-4 top-3 text-gray-400" size={18} />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border border-gray-300 rounded-lg pl-11 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BEF4] focus:border-[#00BEF4] transition"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-2.5 text-gray-500 hover:text-gray-700">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);