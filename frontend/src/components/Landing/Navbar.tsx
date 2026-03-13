import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginModal } from "../UserModal/LoginModal";

export const Navbar = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Navbar */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/operix-logo.png"
                alt="OPERIX Logo"
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback if image doesn't load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
              <div className="text-2xl font-bold hidden">
                <span className="text-[#00BEF4]">O</span>
                <span className="text-[#E80088]">P</span>
                <span className="text-[#FFD102]">E</span>
                <span className="text-[#AA00FD]">R</span>
                <span className="text-[#E80088]">I</span>
                <span className="text-[#AA00FD]">X</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("home")}
                className="font-bold text-gray-700 hover:text-[#E80088] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("products")}
                className="font-bold text-gray-700 hover:text-[#E80088] transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="font-bold text-gray-700 hover:text-[#E80088] transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="font-bold text-gray-700 hover:text-[#E80088] transition-colors"
              >
                About Us
              </button>

              {/* Sign Up Button (Semi-transparent) */}
              <button
                onClick={handleSignUp}
                className="font-bold text-[#E80088] bg-[#E80088]/20 hover:bg-[#E80088]/30 px-6 py-2 rounded-lg transition-all duration-300 border-2 border-[#E80088]"
              >
                Sign up
              </button>

              {/* Log In Button (Solid) */}
              <button
                onClick={handleLogin}
                className="font-bold text-white bg-[#E80088] hover:bg-[#C70070] px-6 py-2 rounded-lg transition-all duration-300 shadow-md"
              >
                Log in
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};