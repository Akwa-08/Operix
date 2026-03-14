import FacebookIcon from "@mui/icons-material/Facebook";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

export const Footer = () => {
  return (
    <footer
      id="about"
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 leading-relaxed tracking-wider">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-12">
          {/* About VTA Link Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              About Us – VTA Link Printing Services
            </h3>
            <p className="text-gray-300 leading-relaxed font-light">
              Founded in 1998 as JoeyenJanc Computer Services, VTA Link Printing
              Services has grown from a small computer-use and document printing
              service into a trusted name in printing solutions for the Surigao
              City area. Now operating under the new name since 2002, VTA Link
              continues to deliver high-quality print solutions for various
              customer needs.
            </p>
          </div>

          {/* About Operix Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              About Operix
            </h3>
            <p className="text-gray-300 leading-relaxed font-light">
              Operix is the web-based integrated management system developed to
              streamline VTA Link Printing Services' day-to-day operations.
              Designed specifically for small-to-medium businesses, Operix
              brings together payroll automation, inventory tracking, order
              management, and reporting tools in one easy-to-use platform. With
              real-time data and centralized control, Operix empowers VTA Link
              to boost efficiency, reduce human error, and scale its business
              with confidence.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-8"></div>

        {/* Social Media & Contact Icons */}
        <div className="flex justify-center gap-6 mb-8">
          <a
            href="https://facebook.com/VTALinkPrintingServices"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
            aria-label="Facebook"
          >
            <FacebookIcon />
          </a>
          <a
            href="mailto:vtalink15@gmail.com"
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            aria-label="Email"
          >
            <EmailIcon />
          </a>
          <a
            href="tel:09507596282"
            className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
            aria-label="Phone"
          >
            <PhoneIcon />
          </a>
        </div>

        {/* Copyright Section */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} VTA Link Printing Services. All
            rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Developed by Operix Development Team
          </p>
        </div>
      </div>
    </footer>
  );
};