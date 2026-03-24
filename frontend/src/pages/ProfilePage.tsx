// frontend/src/pages/ProfilePage.tsx
// Customer/Staff profile — uses db.getMyProfile() + db.updateMyProfile()
// Password changes use authService.updatePassword() via Supabase Auth.
// RLS: users_read_own + users_update_own policies handle all security.

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { db } from '../lib/database';

export const ProfilePage = () => {
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [memberSince, setMemberSince] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load profile from Supabase via db layer (RLS enforces own-row access) ──
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
        if (profile.created_at) {
          setMemberSince(new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }));
        }
      }
    } catch (err: any) {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []);

  const fullName = `${firstName} ${lastName}`.trim() || 'Customer';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'C';

  // ── Save profile via db.updateMyProfile (RLS: users_update_own) ──
  const handleSaveProfile = async () => {
    if (!firstName.trim()) return toast.error("First name is required");
    if (!email.includes("@")) return toast.error("Enter a valid email");

    setIsSaving(true);
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
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadProfile();
  };

  // ── Save password (via Supabase Auth directly) ──
  const handlePasswordSave = async () => {
    if (!newPassword || !confirmPassword) return toast.error("All fields are required");
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl ml-auto bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Personal Information</h2>
          <div className="flex gap-3">
            {isEditing && (
              <button onClick={handleCancelEdit} className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
            <button
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              disabled={isSaving}
              className={`px-6 py-2 rounded-md transition cursor-pointer ${
                isEditing ? "bg-sky-500 text-white hover:bg-sky-600" : "border border-gray-300 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              {isSaving ? "Saving..." : isEditing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
            {initials}
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">{fullName}</h3>
            <p className="text-lg text-gray-600 mb-1">Customer</p>
            {memberSince && <p className="text-gray-500">Member since {memberSince}</p>}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-6">
          <FieldWithIcon label="First Name" icon={<User size={20} />} value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!isEditing} />
          <FieldWithIcon label="Last Name" icon={<User size={20} />} value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!isEditing} />
          <FieldWithIcon label="Email Address" icon={<Mail size={20} />} value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} />
          <FieldWithIcon label="Phone Number" icon={<Phone size={20} />} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={!isEditing} />
          <div className="col-span-2">
            <FieldWithIcon label="Address" icon={<MapPin size={20} />} value={address} onChange={(e) => setAddress(e.target.value)} disabled={!isEditing} />
          </div>
        </div>

        {/* Change Password */}
        <button onClick={() => setShowPasswordModal(true)} className="mt-6 text-sky-500 font-semibold text-sm hover:underline">
          Change Password
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 w-[450px] shadow-xl">
            <h3 className="text-xl font-semibold mb-8">Change Password</h3>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600">New Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-500">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600">Confirm New Password</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-gray-500">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setShowPasswordModal(false)} className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handlePasswordSave} disabled={isPasswordSaving}
                className="bg-sky-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-sky-600 disabled:opacity-50">
                {isPasswordSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Field with Icon ---------- */
const FieldWithIcon = ({ label, icon, value, onChange, disabled }: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-semibold mb-2">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md transition ${
          disabled ? "bg-gray-50" : "bg-white focus:ring-2 focus:ring-sky-500"
        }`}
      />
    </div>
  </div>
);