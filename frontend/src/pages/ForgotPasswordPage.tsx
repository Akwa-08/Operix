// frontend/src/pages/ForgotPasswordPage.tsx
// REFACTORED: Uses centralized authService

import authService from '../services/authService';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); setLoading(false); return; }

    const result = await authService.forgotPassword(email);
    if (!result.success) { setError(result.error || 'Failed to send reset email.'); setLoading(false); return; }
    setSuccess(true); setError(''); setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#AA00FD] to-[#E80088] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-3xl px-12 py-6 shadow-2xl">
            <div className="text-4xl font-bold">
              <span className="text-[#00BEF4]">O</span><span className="text-[#E80088]">P</span>
              <span className="text-[#FFD102]">E</span><span className="text-[#AA00FD]">R</span>
              <span className="text-[#E80088]">I</span><span className="text-[#AA00FD]">X</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Forgot Password?</h1>
            <p className="text-gray-500 text-sm md:text-base">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">Email Address</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required placeholder="Enter your email"
                className={`w-full px-6 py-4 border rounded-2xl text-lg focus:outline-none focus:ring-2 transition-all ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#E80088]"}`} />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {success && <p className="text-green-600 text-sm mt-2">Reset link sent! Check your email.</p>}
            </div>
            <button type="submit" disabled={success || loading}
              className="w-full bg-[#00BEF4] hover:bg-[#0099CC] disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02]">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <button onClick={() => navigate("/")}
          className="mt-6 w-full text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity text-lg">
          <ArrowLeft size={24} /> Back to Homepage
        </button>
      </div>
    </div>
  );
};