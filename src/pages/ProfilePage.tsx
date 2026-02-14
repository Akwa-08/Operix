import {useState} from "react";
import {User, Mail, Phone, MapPin, Users} from "lucide-react";

export const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Personal Information Section */}
      <div className="max-w-6xl ml-auto bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Personal Information</h2>
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className={`px-6 py-2 rounded-md transition cursor-pointer ${
              isEditing
                ? "bg-sky-500 text-white hover:bg-sky-600"
                : "border border-gray-300 hover:bg-gray-50"
            }`}>
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
            JD
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">John Doe</h3>
            <p className="text-lg text-gray-600 mb-1">Customer</p>
            <p className="text-gray-500">Member since June 2025</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                defaultValue="John Doe"
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md transition ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                defaultValue="john.doe@gmail.com"
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md transition ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="tel"
                defaultValue="+64 (965) 123-4567"
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md transition ${
                  isEditing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold mb-2">Role</label>
            <div className="relative">
              <Users
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                defaultValue="Customer"
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md bg-gray-50"
              />
            </div>
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold mb-2">Address</label>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                defaultValue="Cordova, Lapu-Lapu City, Cebu"
                disabled={!isEditing}
                className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md transition ${
                  isEditing ? "bg-white" : "bg-gray-100"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Order History Section */}
      <div className="max-w-6xl ml-auto bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-3xl font-bold mb-8">Order History</h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Total Orders */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-5xl font-bold text-cyan-500 mb-2">15</div>
            <p className="text-gray-600 font-medium">Total Orders</p>
          </div>

          {/* Total Spent */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-5xl font-bold text-pink-600 mb-2">₱2450</div>
            <p className="text-gray-600 font-medium">Total Spent</p>
          </div>

          {/* Pending Orders */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-5xl font-bold text-yellow-500 mb-2">3</div>
            <p className="text-gray-600 font-medium">Pending Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};
