import { supabase } from '../config/supabaseClient';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    passwordMatch: "",
    email: "",
    phone: "",
  });

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (name === "confirmPassword" || name === "password") {
      setErrors((prev) => ({ ...prev, passwordMatch: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = { passwordMatch: "", email: "", phone: "" };
    let isValid = true;

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "Passwords do not match";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Phone validation (basic)
    if (formData.contactNumber.length < 10) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
 
  setSubmitLoading(true);
  setSubmitError('');
 
  const { data, error } = await supabase.auth.signUp({
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    options: {
      data: {
        role: 'customer',
        first_name: formData.firstName,
        last_name: formData.lastName,
        contact_number: formData.contactNumber,
      }
    }
  });
    if (error) {
      setSubmitError(error.message.includes('already registered')
        ? 'An account with this email already exists.'
        : error.message);
      setSubmitLoading(false);
      return;
    }
  
    // Email confirm is OFF — session returned, user is immediately logged in
    if (data.session) {
      navigate('/customer');
      return;
    }
  
    // Email confirm is ON — tell user to check email
    setSuccessMessage('Account created! Please check your email to confirm your account, then log in.');
    setSubmitLoading(false);
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
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-500">
              Join VTA Link and start bringing your ideas to life
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.passwordMatch
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#E80088]"
                }`}
              />
              {errors.passwordMatch && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passwordMatch}
                </p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Your phone number"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#E80088]"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#E80088]"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {submitError && (
              <div className='bg-red-50 border border-red-200 text-red-700
                            rounded-xl px-4 py-3 text-sm font-medium'>
                {submitError}
              </div>
            )}
            
            {successMessage && (
              <div className='bg-green-50 border border-green-200 text-green-700
                            rounded-xl px-4 py-3 text-sm font-medium'>
                {successMessage}
              </div>
            )}


            {/* Submit Button */}
            <button type='submit' disabled={submitLoading}
            className='w-full bg-[#00BEF4] hover:bg-[#0099CC]
                      disabled:bg-gray-400 disabled:cursor-not-allowed
                      text-white font-bold py-4 px-6 rounded-xl transition-all'>
            {submitLoading ? 'Creating account...' : 'Create Account'}
          </button>
          </form>
        </div>

        {/* Back to Homepage */}
        <button
          onClick={handleBackToHomepage}
          className="mt-6 w-full text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};