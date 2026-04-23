import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import authService from "../services/authService";
import type {UserRole} from "../context/AuthContext";

// ── Role → Dashboard route map ───────────────────────────────────────────────
const ROLE_ROUTES: Record<UserRole, string> = {
  customer: "/customer",
  admin: "/admin",
  cashier: "/cashier",
  designer: "/designer",
  production: "/production",
};

const fadeUp = {
  hidden: {opacity: 0, y: 18},
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay},
  }),
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({email: "", password: ""});
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({...prev, [e.target.name]: e.target.value}));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await authService.login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error || "Login failed.");
      setLoading(false);
      return;
    }

    // ── Redirect based on role ───────────────────────────────────────────
    const role = result.user!.role;
    const destination = ROLE_ROUTES[role] || "/";

    navigate(destination);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 px-6 py-7 sm:px-8"
      style={{border: "1px solid rgba(0,0,0,.04)"}}>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Welcome!
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          Sign in to your Operix account
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{opacity: 0, y: -8, height: 0}}
            animate={{opacity: 1, y: 0, height: "auto"}}
            exit={{opacity: 0, y: -8, height: 0}}
            transition={{duration: 0.3, ease: "easeOut"}}
            className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">Login failed</p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="su-input-wrap">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Email
          </label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white focus:border-[#E80088] focus:ring-2 focus:ring-[#E80088]/10"
            />
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="su-input-wrap">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Password
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-[#00BEF4] font-semibold text-[11px] hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white focus:border-[#E80088] focus:ring-2 focus:ring-[#E80088]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="su-submit-btn w-full py-2.5 rounded-lg text-white font-semibold text-[13px] flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{rotate: 360}}
                  transition={{
                    duration: 0.6,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-300 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-100" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.5}
          className="text-center text-xs text-gray-400">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-[#E80088] font-semibold hover:text-[#AA00FD] transition-colors bg-transparent border-none cursor-pointer text-xs">
            Register
          </button>
        </motion.p>
      </form>
    </div>
  );
};
