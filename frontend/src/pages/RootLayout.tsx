import {Outlet} from "react-router-dom";
import SideBar from "../components/UserModal/SideBar";
export const RootLayout = () => {
  return (
    <>
      <SideBar name={""} />
      <Outlet />
    </>
  );
};
