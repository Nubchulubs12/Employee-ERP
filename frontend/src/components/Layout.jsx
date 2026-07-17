import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import PublicFooter from "./PublicFooter";

function Layout() {
  const { pathname } = useLocation();
  const isPortal = pathname.startsWith("/companies/") || pathname.startsWith("/employees/");
  const ownsFooter = ["/terms", "/privacy", "/subscription-terms", "/data-retention", "/payroll-disclaimer", "/contact"].includes(pathname);
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-content"><Outlet /></div>
      {!isPortal && !ownsFooter && <PublicFooter />}
    </div>
  );
}

export default Layout;
