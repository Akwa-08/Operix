// frontend/src/pages/SignUpPage.tsx
// REFACTORED: Uses authService. DB trigger auto-creates public.users row.

import authService from '../services/authService';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", password: "", confirmPassword: "", contactNumber: "", email: "",
  });
  const [errors, setErrors] = useState({ passwordMatch: "", email: "", phone: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "confirmPassword" || name === "password") setErrors(prev => ({ ...prev, passwordMatch: "" }));
  };

  const validateForm = () => {
    const newErrors = { passwordMatch: "", email: "", phone: "" };
    let isValid = true;
    if (formData.password.length < 8) { newErrors.passwordMatch = "Password must be at least 8 characters"; isValid = false; }
    else if (formData.password !== formData.confirmPassword) { newErrors.passwordMatch = "Passwords do not match"; isValid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = "Please enter a valid email address"; isValid = false; }
    if (formData.contactNumber.length < 10) { newErrors.phone = "Please enter a valid phone number"; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);
    setSubmitError('');

    const result = await authService.register({
      email: formData.email, password: formData.password,
      firstName: formData.firstName, lastName: formData.lastName, contactNumber: formData.contactNumber,
    });

    if (!result.success) { setSubmitError(result.error || 'Registration failed.'); setSubmitLoading(false); return; }
    if (!result.needsEmailConfirm) { navigate('/customer'); return; }
    setSuccessMessage('Account created! Please check your email to confirm your account, then log in.');
    setSubmitLoading(false);
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center">Create Your Account</h1>
          <p className="text-gray-500 text-center mb-8">Join VTA Link Printing Services</p>

          {successMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{successMessage}</div>}
          {submitError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{submitError}</div>}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">First Name</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088]" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Last Name</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088]" placeholder="Last name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#E80088]"}`} placeholder="you@example.com" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Contact Number</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#E80088]"}`} placeholder="09171234567" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088]" placeholder="Minimum 8 characters" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 ${errors.passwordMatch ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-[#E80088]"}`} placeholder="Re-enter password" />
                {errors.passwordMatch && <p className="text-red-500 text-sm mt-1">{errors.passwordMatch}</p>}
              </div>

              <button type="submit" disabled={submitLoading}
                className="w-full bg-[#E80088] hover:bg-[#C70070] disabled:bg-gray-400 text-white font-bold py-3 rounded-xl text-base transition-all shadow-lg hover:scale-[1.02]">
                {submitLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <button onClick={() => navigate('/')}
          className="mt-6 w-full text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity text-lg">
          <ArrowLeft size={24} /> Back to Homepage
        </button>
      </div>
    </div>
  );
};