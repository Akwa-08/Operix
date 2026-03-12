// frontend/src/components/UserModal/LoginModal.tsx
 
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
 
interface LoginModalProps { isOpen: boolean; onClose: () => void; }
 
export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
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
        : authError.message.includes('Email not confirmed')
          ? 'Please confirm your email before logging in.'
          : authError.message);
      setLoading(false);
      return;
    }
 
    const role = data.user.user_metadata?.role || 'customer';
 
    // Employees must use the Staff Portal
    if (role !== 'customer') {
      await supabase.auth.signOut();
      setError('Employee accounts must log in via the Staff Portal (/staff-login).');
      setLoading(false);
      return;
    }
 
    onClose();
    navigate('/customer');
  };
 
  if (!isOpen) return null;
 
  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
         onClick={onClose}>
      <div className='bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative'
           onClick={e => e.stopPropagation()}>
 
        <button onClick={onClose}
          className='absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg'>
          <X size={24} className='text-gray-600' />
        </button>
 
        <div className='text-center mb-6'>
          <h2 className='text-3xl font-bold text-[#00BEF4]'>Sign in</h2>
          <p className='text-gray-500 text-sm mt-1'>Welcome back to VTA Link</p>
        </div>
 
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700
                         rounded-xl px-4 py-3 mb-4 text-sm font-medium'>
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className='space-y-5'>
          <input type='email' name='email' value={formData.email}
            onChange={handleChange} placeholder='Email address' required
            className='w-full px-5 py-3 border border-gray-300 rounded-2xl
                       focus:outline-none focus:ring-2 focus:ring-[#E80088]
                       text-base placeholder-gray-400'
          />
          <input type='password' name='password' value={formData.password}
            onChange={handleChange} placeholder='Password' required
            className='w-full px-5 py-3 border border-gray-300 rounded-2xl
                       focus:outline-none focus:ring-2 focus:ring-[#E80088]
                       text-base placeholder-gray-400'
          />
          <button type='submit' disabled={loading}
            className='w-full bg-[#E80088] hover:bg-[#C70070]
                       disabled:bg-gray-400 text-white font-bold
                       py-3 px-6 rounded-2xl text-lg transition-all shadow-lg'>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
 
          <div className='text-center pt-2'>
            <button type='button' onClick={() => { onClose(); navigate('/forgot-password'); }}
              className='text-[#00BEF4] font-bold text-base hover:underline'>
              Forgot password?
            </button>

          </div>
 
          <div className='border-t border-gray-300 my-3' />
 
          <div className='text-center'>
            <span className='text-gray-500'>Don't have an account? </span>
            <button type='button' onClick={() => { onClose(); navigate('/signup'); }}
              className='text-[#E80088] font-bold hover:underline'>
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


