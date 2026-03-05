import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import EmailIcon from "@mui/icons-material/Email";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";

export const ContactInfo = () => {
  return (
    <div
      id="contact"
      className="bg-gradient-to-r from-[#AA00FD] via-[#E80088] to-[#E80088] py-20"
    >
      <div className="max-w-7xl mx-auto px-4 text-center text-white">
        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center mb-8 leading-relaxed tracking-wider">
          Get In Touch
        </h2>
        <p className="text-lg sm:text-xl mb-10">
          Ready to bring your ideas come to life? Contact us today!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300">
            <LocationOnIcon
              style={{ width: "80px", height: "80px" }}
              className="mb-6 mx-auto text-white"
            />
            <h3 className="text-xl font-semibold mb-4">Location</h3>
            <p>Rizal St. in front of Provincial Grandstand, Surigao City</p>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300">
            <FacebookOutlinedIcon
              style={{ width: "80px", height: "80px" }}
              className="mb-6 mx-auto text-white"
            />
            <h3 className="text-xl font-semibold mb-4">Facebook</h3>
            <a
              href="https://facebook.com/VTALinkPrintingServices"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              VTA Link Printing Services
            </a>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300">
            <EmailIcon
              style={{ width: "80px", height: "80px" }}
              className="mb-6 mx-auto text-white"
            />
            <h3 className="text-xl font-semibold mb-4">Email</h3>
            <a
              href="mailto:vtalink15@gmail.com"
              className="hover:underline"
            >
              vtalink15@gmail.com
            </a>
          </div>
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300">
            <LocalPhoneIcon
              style={{ width: "80px", height: "80px" }}
              className="mb-6 mx-auto text-white"
            />
            <h3 className="text-xl font-semibold mb-4">Phone</h3>
            <a href="tel:09507596282" className="block hover:underline">
              0950 759 6282
            </a>
            <a href="tel:09773081894" className="block hover:underline">
              0977 308 1894
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};