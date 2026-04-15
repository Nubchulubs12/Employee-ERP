import { Link ,useLocation ,useNavigate} from 'react-router-dom';
import '../App.css';
import {useEffect, useState} from "react";

function Navbar() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);

    });
    function handleLogout() {
        localStorage.removeItem("user");
        setIsLoggedIn(false);
       navigate("/");

        };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">ESS Portal</Link>
      </div>

      <div className="nav-right">

        {isLoggedIn && <button onClick={handleLogout}>Logout</button>}
      </div>
    </nav>
  );
}

export default Navbar;