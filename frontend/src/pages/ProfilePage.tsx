// frontend/src/pages/ProfilePage.tsx
// Customer/Staff profile — uses db.getMyProfile() + db.updateMyProfile()
// Password changes use authService.updatePassword() via Supabase Auth.
// RLS: users_read_own + users_update_own policies handle all security.

import {useState, useEffect} from "react";
import {User, Mail, Phone, MapPin, Lock, Eye, EyeOff} from "lucide-react";
import toast from "react-hot-toast";
import {useAuth} from "../context/AuthContext";
import authService from "../services/authService";
import { db, uploadProfilePicture } from "../lib/database";
import { LoadingSpinner } from "../components/Shared/UI/LoadingSpinner";

export const ProfilePage = () => {
  const { refreshUser, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load profile from Supabase via db layer (RLS enforces own-row access) ──
  const loadProfile = async () => {
    setLoading(true);
    try {
      const profile = await db.getMyProfile();
      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(profile.email || "");
        setPhoneNumber(profile.contact_number || "");
        setAddress(profile.address || "");
        setAvatarUrl(profile.avatar_url || "");
        if (profile.created_at) {
          setMemberSince(
            new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }),
          );
        }
      }
    } catch (err: any) {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const fullName = `${firstName} ${lastName}`.trim() || "Customer";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "C";

  // ── Save profile via db.updateMyProfile (RLS: users_update_own) ──
  const handleSaveProfile = async () => {
    if (!firstName.trim()) return toast.error("First name is required");
    if (!email.includes("@")) return toast.error("Enter a valid email");

    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;
      
      if (profilePictureFile) {
        setIsUploadingPicture(true);
        finalAvatarUrl = await uploadProfilePicture(profilePictureFile);
        setAvatarUrl(finalAvatarUrl);
        setProfilePictureFile(null);
        setIsUploadingPicture(false);
      }

      await db.updateMyProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: phoneNumber,
        address,
        avatar_url: finalAvatarUrl,
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
    setProfilePictureFile(null);
    loadProfile();
  };

  // ── Save password (via Supabase Auth directly) ──
  const handlePasswordSave = async () => {
    if (!newPassword || !confirmPassword)
      return toast.error("All fields are required");
    if (newPassword.length < 8)
      return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    setIsPasswordSaving(true);
    const result = await authService.updatePassword(newPassword);
    setIsPasswordSaving(false);

    if (result.success) {
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowNew(false);
      setShowConfirm(false);
    } else {
      toast.error(result.error || "Failed to change password");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Personal Information</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition active:scale-95">
                Cancel
              </button>
            )}
            <button
              onClick={() =>
                isEditing ? handleSaveProfile() : setIsEditing(true)
              }
              disabled={isSaving}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl transition font-bold shadow-md cursor-pointer ${
                isEditing
                  ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-100"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-gray-100"
              } disabled:opacity-50 active:scale-95`}>
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 pb-10 border-b border-gray-100 text-center sm:text-left">
          <div className="relative group w-24 h-24 rounded-full">
            {avatarUrl || (profilePictureFile && URL.createObjectURL(profilePictureFile)) ? (
              <img 
                src={profilePictureFile ? URL.createObjectURL(profilePictureFile) : avatarUrl} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full shadow-inner" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600 shadow-inner">
                {initials}
              </div>
            )}
            
            {isEditing && (
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                {isUploadingPicture ? "Uploading..." : "Add/Edit"}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  disabled={isUploadingPicture || isSaving}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfilePictureFile(e.target.files[0]);
                    }
                  }} 
                />
              </label>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-gray-900">{fullName}</h3>
            <p className="text-lg text-cyan-600 font-semibold capitalize">{user?.role || 'Member'}</p>
            {memberSince && <p className="text-sm text-gray-400 font-medium">Member since {memberSince}</p>}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FieldWithIcon
            label="First Name"
            icon={<User size={18} />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={!isEditing}
          />
          <FieldWithIcon
            label="Last Name"
            icon={<User size={18} />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={!isEditing}
          />
          <FieldWithIcon
            label="Email Address"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isEditing}
          />
          <FieldWithIcon
            label="Phone Number"
            icon={<Phone size={18} />}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={!isEditing}
          />
          <div className="sm:col-span-2">
            <FieldWithIcon
              label="Address"
              icon={<MapPin size={18} />}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="mt-6 text-sky-500 font-semibold text-sm hover:underline">
          Change Password
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Change Password</h3>

            <div className="mb-6">
              <label className="text-sm font-bold text-gray-600 mb-2 block">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-12 py-3.5 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-bold text-gray-600 mb-2 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-12 py-3.5 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-5 py-3.5 border border-gray-200 rounded-xl text-base font-bold text-gray-600 hover:bg-gray-50 transition active:scale-95">Cancel</button>
              <button onClick={handlePasswordSave} disabled={isPasswordSaving}
                className="flex-1 bg-cyan-500 text-white px-6 py-3.5 rounded-xl text-base font-bold hover:bg-cyan-600 shadow-md shadow-cyan-100 disabled:opacity-50 transition active:scale-95">
                {isPasswordSaving ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Field with Icon ---------- */
const FieldWithIcon = ({
  label,
  icon,
  value,
  onChange,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-cyan-500">
        {icon}
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-12 pr-4 py-3.5 border-none rounded-xl transition-all duration-200 ${
          disabled ? "bg-gray-50 text-gray-500" : "bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-cyan-500"
        }`}
      />
    </div>
  </div>
);
