import {Navbar} from "../components/Landing/Navbar";
import {LandingContent} from "../components/Landing/LandingContent";
import {MainContent} from "../components/Landing/MainContent";
import {ContactInfo} from "../components/Landing/ContactInfo";
import {Footer} from "../components/Landing/Footer";
export const LandingPage = () => {
  return (
    <>
      <Navbar />
      <LandingContent />
      <MainContent />
      <ContactInfo />
      <Footer />
    </>
  );
};
