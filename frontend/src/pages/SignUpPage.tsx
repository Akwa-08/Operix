// frontend/src/pages/SignUpPage.tsx
// REFACTORED: Uses authService. DB trigger auto-creates public.users row.

import authService from "../services/authService";
import {useState, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Sparkles,
  Printer,
  Palette,
  Zap,
} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";

/* ── Minimal CSS (non-animation styles only) ────────────────────────── */
const styleTag =
  document.getElementById("signup-styles") ||
  (() => {
    const s = document.createElement("style");
    s.id = "signup-styles";
    s.textContent = `
    .su-input-wrap input:focus{border-color:#E80088 !important;box-shadow:0 0 0 3px rgba(232,0,136,.1) !important}
    .su-submit-btn{
      background:linear-gradient(135deg,#E80088 0%,#AA00FD 50%,#00BEF4 100%);
      background-size:200% 200%;
      transition:all .3s ease;
    }
    .su-submit-btn:hover:not(:disabled){
      background-position:100% 0;
      transform:translateY(-2px);
      box-shadow:0 8px 30px rgba(232,0,136,.35);
    }
    .su-submit-btn:active:not(:disabled){transform:translateY(0);box-shadow:0 4px 15px rgba(232,0,136,.25)}
    .su-glass{backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25)}
    .su-link:hover{color:#E80088 !important}
  `;
    document.head.appendChild(s);
    return s;
  })();
void styleTag;

/* ── Framer Motion variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: {opacity: 0, y: 18},
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay},
  }),
};

const floatVariant = (yRange: number, rotRange: number, dur: number) => ({
  animate: {
    y: [0, -yRange, 0],
    rotate: [0, rotRange, 0],
    transition: {duration: dur, ease: "easeInOut" as const, repeat: Infinity},
  },
});

const pulseRing = (delay: number = 0) => ({
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.35, 0.55, 0.35],
    transition: {
      duration: 4,
      ease: "easeInOut" as const,
      repeat: Infinity,
      delay,
    },
  },
});

export const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
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
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
    if (name === "confirmPassword" || name === "password")
      setErrors((prev) => ({...prev, passwordMatch: ""}));
    if (name === "email") setErrors((prev) => ({...prev, email: ""}));
    if (name === "contactNumber") setErrors((prev) => ({...prev, phone: ""}));
  };

  const validateForm = () => {
    const newErrors = {passwordMatch: "", email: "", phone: ""};
    let isValid = true;
    if (formData.password.length < 8) {
      newErrors.passwordMatch = "Password must be at least 8 characters";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.passwordMatch = "Passwords do not match";
      isValid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
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
    setSubmitError("");

    const result = await authService.register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      contactNumber: formData.contactNumber,
    });

    if (!result.success) {
      setSubmitError(result.error || "Registration failed.");
      setSubmitLoading(false);
      return;
    }
    if (!result.needsEmailConfirm) {
      navigate("/customer");
      return;
    }
    setSuccessMessage(
      "Account created! Please check your email to confirm your account, then log in.",
    );
    setSubmitLoading(false);
  };

  /* ── Password strength ────────────────────────────────────────────── */
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return {score: 0, label: "", color: ""};
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return {score: 1, label: "Weak", color: "#ef4444"};
    if (score <= 2) return {score: 2, label: "Fair", color: "#f59e0b"};
    if (score <= 3) return {score: 3, label: "Good", color: "#3b82f6"};
    if (score <= 4) return {score: 4, label: "Strong", color: "#22c55e"};
    return {score: 5, label: "Excellent", color: "#10b981"};
  }, [formData.password]);

  /* ── Feature cards for left panel ─────────────────────────────────── */
  const features = [
    {icon: Printer, label: "Custom Printing", desc: "High-quality prints"},
    {icon: Palette, label: "Design Studio", desc: "Professional designs"},
    {icon: Zap, label: "Fast Delivery", desc: "Quick turnaround"},
  ];

  return (
    <div className="min-h-screen flex font-['Inter',system-ui,sans-serif]">
      {/* ══════════════════════════════════════════════════════════════
           LEFT SIDE — gradient branding panel
         ══════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-10 xl:p-12"
        style={{
          background:
            "linear-gradient(160deg, #AA00FD 0%, #E80088 40%, #C70070 70%, #AA00FD 100%)",
        }}>
        {/* Decorative floating shapes */}
        <motion.div
          {...floatVariant(20, 8, 6)}
          animate="animate"
          className="absolute"
          style={{
            top: "8%",
            right: "12%",
            width: 80,
            height: 80,
            borderRadius: "24px",
            background: "rgba(255,209,2,.25)",
          }}
        />
        <motion.div
          {...floatVariant(28, -6, 8)}
          animate="animate"
          className="absolute"
          style={{
            top: "35%",
            right: "8%",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(0,190,244,.2)",
          }}
        />
        <motion.div
          {...floatVariant(16, 12, 7)}
          animate="animate"
          className="absolute"
          style={{
            bottom: "20%",
            left: "8%",
            width: 100,
            height: 100,
            borderRadius: "28px",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)",
          }}
        />
        <motion.div
          {...floatVariant(28, -6, 8)}
          animate="animate"
          className="absolute"
          style={{
            top: "60%",
            left: "30%",
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,209,2,.15)",
          }}
        />
        <motion.div
          {...pulseRing(0)}
          animate="animate"
          className="absolute"
          style={{
            top: "15%",
            left: "15%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        />
        <motion.div
          {...pulseRing(2)}
          animate="animate"
          className="absolute"
          style={{
            bottom: "10%",
            right: "10%",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        />

        {/* Logo */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              OPERIX
            </span>
          </div>
        </motion.div>

        {/* Marketing copy */}
        <div className="relative z-10 space-y-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}>
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Create your{"\n"}
              <br />
              <span className="text-yellow-300">free account</span> today.
            </h2>
            <p className="mt-3 text-sm text-white/70 max-w-sm leading-relaxed">
              Join thousands of businesses streamlining their printing orders
              with Operix.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="space-y-2">
            {features.map(({icon: Icon, label, desc}, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0.2 + i * 0.08}
                whileHover={{x: 4}}
                className="su-glass rounded-xl px-4 py-3 flex items-center gap-3 cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-white/60 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="relative z-10 flex items-center gap-8 text-sm text-white/40">
          <span className="su-link cursor-pointer transition-colors">
            Terms
          </span>
          <span className="su-link cursor-pointer transition-colors">
            Privacy
          </span>
          <span className="su-link cursor-pointer transition-colors">
            Contact
          </span>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           RIGHT SIDE — sign up form
         ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center px-5 py-6 sm:px-8 bg-gray-50/80 min-h-screen overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="lg:hidden text-center mb-5">
            <div className="inline-flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #E80088, #AA00FD)",
                }}>
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-[#00BEF4]">O</span>
                <span className="text-[#E80088]">P</span>
                <span className="text-[#FFD102]">E</span>
                <span className="text-[#AA00FD]">R</span>
                <span className="text-[#E80088]">I</span>
                <span className="text-[#AA00FD]">X</span>
              </span>
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 px-6 py-7 sm:px-8"
            style={{border: "1px solid rgba(0,0,0,.04)"}}>
            {/* Heading */}
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Create Account
              </h1>
              <p className="mt-1 text-xs text-gray-400">
                VTA Link Printing Services — Start ordering in minutes
              </p>
            </div>

            {/* Success message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{opacity: 0, y: -8, height: 0}}
                  animate={{opacity: 1, y: 0, height: "auto"}}
                  exit={{opacity: 0, y: -8, height: 0}}
                  transition={{duration: 0.3, ease: "easeOut"}}
                  className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Registration successful!
                    </p>
                    <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                      {successMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {submitError && (
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
                    <p className="text-sm font-semibold text-red-800">
                      Something went wrong
                    </p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">
                      {submitError}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {!successMessage && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* ── Name row ──────────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.15}
                  className="grid grid-cols-2 gap-3">
                  <div className="su-input-wrap">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                      />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="su-input-wrap">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <User
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                      />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Doe"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* ── Email ─────────────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
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
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white ${errors.email ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{opacity: 0, y: -4}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -4}}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Contact Number ────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.25}
                  className="su-input-wrap">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                    />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      placeholder="09171234567"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white ${errors.phone ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.phone && (
                      <motion.p
                        initial={{opacity: 0, y: -4}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -4}}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Password ──────────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.3}
                  className="su-input-wrap">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Password
                  </label>
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
                      placeholder="Minimum 8 characters"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  <AnimatePresence>
                    {formData.password && (
                      <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: "auto"}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.2}}
                        className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                              key={i}
                              className="h-1 flex-1 rounded-full"
                              animate={{
                                backgroundColor:
                                  i <= passwordStrength.score
                                    ? passwordStrength.color
                                    : "#e5e7eb",
                              }}
                              transition={{duration: 0.3}}
                            />
                          ))}
                        </div>
                        <p
                          className="text-[11px] font-medium"
                          style={{color: passwordStrength.color}}>
                          {passwordStrength.label}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Confirm Password ──────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.35}
                  className="su-input-wrap">
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter your password"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-lg border text-[13px] text-gray-800 placeholder-gray-300 outline-none transition-all bg-gray-50/50 focus:bg-white ${errors.passwordMatch ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.passwordMatch && (
                      <motion.p
                        initial={{opacity: 0, y: -4}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -4}}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.passwordMatch}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Submit ────────────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.4}>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="su-submit-btn w-full py-2.5 rounded-lg text-white font-semibold text-[13px] flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitLoading ? (
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
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </motion.div>

                {/* ── Terms ────────────────────────────────────── */}
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.45}
                  className="text-[11px] text-gray-400 text-center leading-relaxed">
                  By signing up, you agree to our{" "}
                  <span className="text-gray-500 font-medium cursor-pointer hover:text-[#E80088] transition-colors">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-gray-500 font-medium cursor-pointer hover:text-[#E80088] transition-colors">
                    Privacy Policy
                  </span>
                  .
                </motion.p>

                {/* ── Divider ─────────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.48}
                  className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </motion.div>

                {/* ── Sign in link ──────────────────────────────── */}
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                  className="text-center text-xs text-gray-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-[#E80088] font-semibold hover:text-[#AA00FD] transition-colors bg-transparent border-none cursor-pointer text-xs">
                    Sign In
                  </button>
                </motion.p>
              </form>
            )}
          </motion.div>

          {/* Bottom brand mark */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.55}
            className="text-center text-[10px] text-gray-300 mt-4">
            © 2026 VTA Link Printing Services. All rights reserved.
          </motion.p>
        </div>
      </div>
    </div>
  );
};
