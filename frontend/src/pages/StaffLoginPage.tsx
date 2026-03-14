// frontend/src/pages/StaffLoginPage.tsx
// Employee-only login page at /staff-login
 
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import type { UserRole } from '../context/AuthContext';
 
const ROLE_ROUTES: Partial<Record<UserRole, string>> = {
  admin: '/admin',
  designer: '/designer',
  cashier: '/cashier',
  production: '/production',
};
 
const EMPLOYEE_ROLES: UserRole[] = ['admin', 'designer', 'cashier', 'production'];
 
const StaffLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
 
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });
 
    if (authError) {
      setError(authError.message.includes('Invalid login credentials')
        ? 'Incorrect email or password.'
        : authError.message);
      setLoading(false);
      return;
    }
 
    const role = data.user.user_metadata?.role as UserRole;
 
    // Block customers from using this portal

    if (!role || !EMPLOYEE_ROLES.includes(role)) {
      await supabase.auth.signOut();
      setError('This portal is for employees only. Use the login on the homepage.');
      setLoading(false);
      return;
    }
 
    navigate(ROLE_ROUTES[role] || '/', { replace: true });
  };
 
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2563EB]
                    flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
 
        {/* Brand */}
        <div className='text-center mb-8'>
          <div className='text-5xl font-bold mb-2'>
            <span className='text-[#00BEF4]'>O</span>
            <span className='text-[#E80088]'>P</span>
            <span className='text-[#FFD102]'>E</span>
            <span className='text-[#AA00FD]'>R</span>
            <span className='text-[#E80088]'>I</span>
            <span className='text-[#AA00FD]'>X</span>
          </div>
          <p className='text-blue-200 font-semibold text-lg'>Staff Portal</p>
          <p className='text-blue-300 text-sm mt-1'>Authorized employees only</p>
        </div>
 
        {/* Card */}
        <div className='bg-white rounded-3xl shadow-2xl p-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-1 text-center'>
            Employee Sign In
          </h1>
          <p className='text-gray-500 text-sm text-center mb-6'>
            Use your company-assigned credentials
          </p>
 
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700
                           rounded-xl px-4 py-3 mb-4 text-sm font-medium'>
              {error}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label className='block text-sm font-bold text-gray-900 mb-2'>
                Email Address
              </label>
              <input type='email' name='email' value={formData.email}
                onChange={handleChange} placeholder='employee@vtalink.com'
                required autoComplete='email'
                className='w-full px-4 py-3 border border-gray-300 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           transition-all text-base'
              />
            </div>
 
            <div>
              <label className='block text-sm font-bold text-gray-900 mb-2'>
                Password
              </label>
              <input type='password' name='password' value={formData.password}
                onChange={handleChange} placeholder='Enter your password'
                required autoComplete='current-password'
                className='w-full px-4 py-3 border border-gray-300 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           transition-all text-base'
              />
            </div>
 
            <div className='text-right'>
              <Link to='/forgot-password'
                className='text-sm text-blue-600 hover:text-blue-800
                           font-semibold hover:underline'>
                Forgot password?
              </Link>
            </div>
 
            <button type='submit' disabled={loading}
              className='w-full bg-[#1E3A5F] hover:bg-[#2563EB]
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         text-white font-bold py-3 rounded-xl text-base
                         transition-all duration-300 shadow-lg hover:scale-[1.02]'>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
 
        <div className='text-center mt-6'>
          <Link to='/' className='text-blue-200 hover:text-white text-sm transition-colors'>
            ← Back to VTA Link website
          </Link>
        </div>
      </div>
    </div>
  );
};
 
export default StaffLoginPage;


