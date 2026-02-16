import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const AdminProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const user = {
    fullName: "Cen Tino",
    email: "Cen.Tino@gmail.com",
    phoneNumber: "+64 (965) 123-4567",
    address: "Surigao, 123",
    role: "Admin",
  };

  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [address, setAddress] = useState(user.address);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveProfile = () => {
    if (!fullName.trim()) return toast.error("Full Name is required");
    if (!email.includes("@")) return toast.error("Enter a valid email");

    setIsProfileSaving(true);
    setTimeout(() => {
      setIsProfileSaving(false);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    }, 1000);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handlePasswordSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("All password fields are required");

    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");

    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    setIsPasswordSaving(true);
    setTimeout(() => {
      setIsPasswordSaving(false);
      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Admin Account header outside the card */}
      <div className="text-3xl font-bold mb-6">{user.role} Account</div>

      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-5xl">
        {/* Personal Info Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold">Personal Information</h2>
          <div className="flex gap-3">
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-1.5 rounded-md text-sm border"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() =>
                isEditing ? handleSaveProfile() : setIsEditing(true)
              }
              disabled={isProfileSaving}
              className="bg-sky-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-sky-600 disabled:opacity-50"
            >
              {isProfileSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-2xl font-bold">
            {fullName ? fullName.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{fullName || "Admin Name"}</h3>
            <p className="text-gray-500">{user.role}</p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <InputField
            label="Full Name"
            icon={<User size={16} />}
            value={fullName}
            onChange={setFullName}
            disabled={!isEditing}
          />
          <InputField
            label="Email Address"
            icon={<Mail size={16} />}
            value={email}
            onChange={setEmail}
            disabled={!isEditing}
          />
          <InputField
            label="Phone Number"
            icon={<Phone size={16} />}
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={!isEditing}
          />
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <input
              value={user.role}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="col-span-2">
            <InputField
              label="Address"
              icon={<MapPin size={16} />}
              value={address}
              onChange={setAddress}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="text-sky-600 font-medium hover:underline"
        >
          Change Password
        </button>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg animate-fadeIn">
              <h3 className="text-lg font-semibold mb-6">Change Password</h3>

              <PasswordField
                label="Current Password"
                value={currentPassword}
                setValue={setCurrentPassword}
                show={showCurrent}
                setShow={setShowCurrent}
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                setValue={setNewPassword}
                show={showNew}
                setShow={setShowNew}
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                show={showConfirm}
                setShow={setShowConfirm}
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSave}
                  disabled={isPasswordSaving}
                  className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 disabled:opacity-50"
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

const InputField = ({ label, icon, value, onChange, disabled }: any) => (
  <div>
    <label className="text-sm text-gray-600">{label}</label>
    <div className="relative mt-1">
      <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md pl-9 pr-3 py-2 disabled:bg-gray-100"
      />
    </div>
  </div>
);

const PasswordField = ({ label, value, setValue, show, setShow }: any) => (
  <div className="mb-4">
    <label className="text-sm text-gray-600">{label}</label>
    <div className="relative mt-1">
      <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-md pl-9 pr-10 py-2"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-2.5 text-gray-500"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);
