import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import EmailIcon from "@mui/icons-material/Email";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
export const ContactInfo = () => {
  return (
    <>
      <div className="bg-linear-to-r from-[#AA00FD] via-[#FF48AC] to-[#FF48AC] py-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h2 className="text-7xl font-semibold text-center mb-8 leading-relaxed tracking-wider">
            Get In Touch
          </h2>
          <p className="text-lg mb-10">
            Ready to bring your ideas come to life? Contact us today!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-12">
            <div className="p-6">
              <LocationOnIcon
                style={{width: "80px", height: "80px"}}
                className="mb-6 mx-auto text-white"
              />
              <h3 className="text-xl font-semibold mb-4">Location</h3>
              <p>Rizal St. in front of Provincial Grandstand, Surigao City</p>
            </div>
            <div className="p-6">
              <FacebookOutlinedIcon
                style={{width: "80px", height: "80px"}}
                className="mb-6 mx-auto text-white"
              />
              <h3 className="text-xl font-semibold mb-4">Facebook</h3>
              <p>VTA Link Printing Services</p>
            </div>
            <div className="p-6">
              <EmailIcon
                style={{width: "80px", height: "80px"}}
                className="mb-6 mx-auto text-white"
              />
              <h3 className="text-xl font-semibold mb-4">Email</h3>
              <p>vtalink15@gmail.com</p>
            </div>
            <div className="p-6">
              <LocalPhoneIcon
                style={{width: "80px", height: "80px"}}
                className="mb-6 mx-auto text-white"
              />
              <h3 className="text-xl font-semibold mb-4">Phone</h3>
              <p>0950 759 6282</p>
              <p>0977 308 1894</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
