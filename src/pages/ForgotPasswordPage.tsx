import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // TODO: API call to send reset link
    console.log("Sending reset link to:", email);
    
    setSuccess(true);
    setError("");
    
    // Show success message
    setTimeout(() => {
      alert("Password reset link has been sent to your email!");
      navigate("/");
    }, 1500);
  };

  const handleBackToHomepage = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#AA00FD] to-[#E80088] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-3xl px-12 py-6 shadow-2xl">
            <img
              src="/operix-logo.png"
              alt="OPERIX Logo"
              className="h-16 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="text-4xl font-bold hidden">
              <span className="text-[#00BEF4]">O</span>
              <span className="text-[#E80088]">P</span>
              <span className="text-[#FFD102]">E</span>
              <span className="text-[#AA00FD]">R</span>
              <span className="text-[#E80088]">I</span>
              <span className="text-[#AA00FD]">X</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Forgot Password?
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
                required
                className={`w-full px-6 py-4 border rounded-2xl text-lg focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#E80088]"
                }`}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm mt-2">
                  Reset link sent! Check your email.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={success}
              className="w-full bg-[#00BEF4] hover:bg-[#0099CC] disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Send Reset Link
            </button>
          </form>
        </div>

        {/* Back to Homepage */}
        <button
          onClick={handleBackToHomepage}
          className="mt-6 w-full text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity text-lg"
        >
          <ArrowLeft size={24} />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};