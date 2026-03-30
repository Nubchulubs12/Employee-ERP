import { Link } from 'react-router-dom';
import '../App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-logo">ERP Portal</Link>
      </div>

      <div className="nav-right">
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link">Register</Link>
      </div>
    </nav>
  );
}

export default Navbar;