import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: API call to authenticate
    console.log("Login:", formData);

    // TODO: Navigate based on user role from API response
    // For now, navigate to customer page
    navigate("/customer");

    onClose();
  };

  const handleForgotPassword = () => {
    onClose();
    navigate("/forgot-password");
  };

  const handleRegister = () => {
    onClose();
    navigate("/signup");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#00BEF4]">Sign in</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
              className="w-full px-5 py-3 border border-gray-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full px-5 py-3 border border-gray-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all placeholder-gray-400"
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full bg-[#E80088] hover:bg-[#C70070] text-white font-bold py-3 px-6 rounded-2xl text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
          >
            Sign In
          </button>

          {/* Forgot Password */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#00BEF4] hover:text-[#0099CC] font-bold text-base hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-5"></div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-500 text-base inline">
              Don't have an account?{" "}
            </p>
            <button
              type="button"
              onClick={handleRegister}
              className="text-[#E80088] hover:text-[#C70070] font-bold text-base hover:underline transition-colors"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};