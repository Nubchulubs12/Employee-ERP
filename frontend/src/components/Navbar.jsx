import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../App.css';
import { useEffect, useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileLink, setProfileLink] = useState("/");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      setIsLoggedIn(true);
      const user = JSON.parse(raw);
      if (user.userType === "employee") {
        setProfileLink(`/employees/${user.id}`);
      } else if (user.userType === "company") {
        setProfileLink(`/companies/${user.id}`);
      }
  if (location.pathname === "/login" || location.pathname === "/register") {
          if (user.userType === "employee") {
            navigate(`/employees/${user.id}`, { replace: true });
          } else if (user.userType === "company") {
            navigate(`/companies/${user.id}`, { replace: true });
          }
        }
    } else {
      setIsLoggedIn(false);
      setProfileLink("/");
    }
  }, [location]);

  function handleLogout() {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
          <div className="nave-left a:hover">
        <Link to="/" className="nav-logo">ESS Portal</Link>
        {isLoggedIn && <Link to={profileLink} className="nav-logo"> | Profile</Link>}
        </div>
      </div>

      <div className="nav-right">
        {isLoggedIn && <button onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
}

export default Navbar;