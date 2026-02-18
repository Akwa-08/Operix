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
    <div className="flex flex-col w-full ml-6 mt-6">
      {/* Header */}
      <div className="text-4xl font-bold mb-8">{user.role} Account</div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-10 w-[1000px] ml-15">
        {/* Personal Info Header */}
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold tracking-wide">
            Personal Information
          </h2>

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
              onClick={() =>
                isEditing ? handleSaveProfile() : setIsEditing(true)
              }
              disabled={isProfileSaving}
              className="bg-sky-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-sky-600 transition disabled:opacity-50"
            >
              {isProfileSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-5 mb-10">
          
          <div className="w-20 h-20 rounded-full bg-sky-500 flex items-center justify-center text-white text-3xl font-bold shadow-sm">
            {fullName ? fullName.charAt(0).toUpperCase() : "A"}
          </div>
          <div>
            <h3 className="font-bold text-2xl">
              {fullName || "Admin Name"}
            </h3>
            <p className="text-gray-500 text-medium tracking-wide">
              {user.role}
            </p>
          </div>
        </div>

        <hr className="border-t border-black my-8" />


        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <InputField
            label="Full Name"
            icon={<User size={18} />}
            value={fullName}
            onChange={setFullName}
            disabled={!isEditing}
          />
          <InputField
            label="Email Address"
            icon={<Mail size={18} />}
            value={email}
            onChange={setEmail}
            disabled={!isEditing}
          />
          <InputField
            label="Phone Number"
            icon={<Phone size={18} />}
            value={phoneNumber}
            onChange={setPhoneNumber}
            disabled={!isEditing}
          />

          <div>
            <label className="text-sm font-semibold text-gray-600 tracking-wide">
              Role
            </label>
            <input
              value={user.role}
              disabled
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100"
            />
          </div>

          <div className="col-span-2">
            <InputField
              label="Address"
              icon={<MapPin size={18} />}
              value={address}
              onChange={setAddress}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="text-sky-600 font-semibold text-sm hover:underline"
        >
          Change Password
        </button>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-10 w-[450px] shadow-xl">
              <h3 className="text-xl font-semibold mb-8">
                Change Password
              </h3>

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
                  className="bg-sky-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-sky-600 transition disabled:opacity-50"
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
    <label className="text-sm font-semibold text-black-600 tracking-wide">
      {label}
    </label>
    <div className="relative mt-2">
      <div className="absolute left-4 top-3 text-gray-400">{icon}</div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-gray-100"
      />
    </div>
  </div>
);

/* ---------- Password Field ---------- */

const PasswordField = ({ label, value, setValue, show, setShow }: any) => (
  <div className="mb-6">
    <label className="text-sm font-semibold text-gray-600 tracking-wide">
      {label}
    </label>
    <div className="relative mt-2">
      <Lock className="absolute left-4 top-3 text-gray-400" size={18} />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border border-gray-300 rounded-lg pl-11 pr-12 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-2.5 text-gray-500 hover:text-gray-700"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);
