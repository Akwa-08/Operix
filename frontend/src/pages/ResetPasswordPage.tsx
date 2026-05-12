// frontend/src/pages/ResetPasswordPage.tsx
// Handles the redirect from Supabase password reset email.
// URL: /reset-password#access_token=...&type=recovery
// Supabase client auto-detects the token in the URL hash and establishes a session.

import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowLeft, Lock, Eye, EyeOff, CheckCircle} from "lucide-react";
import {supabase} from "../config/supabaseClient";
import authService from "../services/authService";

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // ── Wait for Supabase to detect the recovery token from URL hash ───────
  useEffect(() => {
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Supabase detected the recovery token — session is now active
        setSessionReady(true);
      } else if (event === "SIGNED_IN" && session) {
        // Some Supabase versions fire SIGNED_IN instead of PASSWORD_RECOVERY
        setSessionReady(true);
      }
    });

    // Fallback: check if session already exists (user may have arrived with valid token)
    const checkSession = async () => {
      const {
        data: {session},
      } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Give Supabase a moment to process the hash fragment
        setTimeout(async () => {
          const {
            data: {session: retrySession},
          } = await supabase.auth.getSession();
          if (retrySession) {
            setSessionReady(true);
          } else {
            setSessionError(true);
          }
        }, 2000);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await authService.updatePassword(newPassword);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Sign out so they log in fresh with new password
      await supabase.auth.signOut();
    } else {
      setError(
        result.error || "Failed to update password. The link may have expired.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#AA00FD] to-[#E80088] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white rounded-3xl px-12 py-6 shadow-2xl">
            <div className="text-4xl font-bold">
              <span className="text-[#00BEF4]">O</span>
              <span className="text-[#E80088]">P</span>
              <span className="text-[#FFD102]">E</span>
              <span className="text-[#AA00FD]">R</span>
              <span className="text-[#E80088]">I</span>
              <span className="text-[#AA00FD]">X</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* ── Success State ─────────────────────────────────────────── */}
          {success && (
            <div className="text-center">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Password Updated!
              </h1>
              <p className="text-gray-500 mb-8">
                Your password has been changed successfully. You can now log in
                with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-[#E80088] hover:bg-[#C70070] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02]">
                Go to Login
              </button>
            </div>
          )}

          {/* ── Session Error State ───────────────────────────────────── */}
          {!success && sessionError && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Invalid or Expired Link
              </h1>
              <p className="text-gray-500 mb-8">
                This password reset link has expired or is invalid. Please
                request a new one.
              </p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-[#00BEF4] hover:bg-[#0099CC] text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02]">
                Request New Link
              </button>
            </div>
          )}

          {/* ── Loading Session State ─────────────────────────────────── */}
          {!success && !sessionError && !sessionReady && (
            <div className="space-y-8 py-8 animate-pulse">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-64 bg-gray-100 rounded-xl" />
                <div className="h-4 w-48 bg-gray-50 rounded-lg" />
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                    <div className="h-14 w-full bg-gray-50 rounded-2xl" />
                  </div>
                ))}
                <div className="h-14 w-full bg-gray-100 rounded-xl" />
              </div>
            </div>
          )}

          {/* ── Reset Form ────────────────────────────────────────────── */}
          {!success && !sessionError && sessionReady && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Set New Password
                </h1>
                <p className="text-gray-500 text-sm md:text-base">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-4 text-gray-400"
                      size={20}
                    />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 8 characters"
                      className="w-full px-12 py-4 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
                      {showNew ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-4 text-gray-400"
                      size={20}
                    />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter password"
                      className="w-full px-12 py-4 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-[#E80088] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
                      {showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E80088] hover:bg-[#C70070] disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02]">
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to Homepage */}
        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full text-white font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-80 transition-opacity text-lg">
          <ArrowLeft size={24} /> Back to Homepage
        </button>
      </div>
    </div>
  );
};
