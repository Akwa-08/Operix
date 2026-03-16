// frontend/src/components/UserModal/LoginModal.tsx
// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED LOGIN MODAL — Handles ALL roles (customer + staff)
// No separate StaffLoginPage needed. Role-based redirect after login.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import authService from '../../services/authService';
import type { UserRole } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Role → Dashboard route map ───────────────────────────────────────────────
const ROLE_ROUTES: Record<UserRole, string> = {
  customer: '/customer',
  admin: '/admin',
  cashier: '/cashier',
  designer: '/designer',
  production: '/production',
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await authService.login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error || 'Login failed.');
      setLoading(false);
      return;
    }

    // ── Redirect based on role ───────────────────────────────────────────
    const role = result.user!.role;
    const destination = ROLE_ROUTES[role] || '/';

    onClose();
    setFormData({ email: '', password: '' });
    navigate(destination);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          Sign in to your Operix account
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E80088] hover:bg-[#C70070] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-all duration-300 shadow-lg hover:scale-[1.02]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { onClose(); navigate('/forgot-password'); }}
              className="text-[#00BEF4] font-bold text-base hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="border-t border-gray-300 my-3" />

          <div className="text-center">
            <span className="text-gray-500">Don't have an account? </span>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/signup'); }}
              className="text-[#E80088] font-bold hover:underline"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};