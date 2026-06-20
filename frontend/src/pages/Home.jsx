import { Link } from 'react-router-dom';
import '../App.css';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to ESS Portal</h1>
        <p>
          A simple place for employees to sign in and for companies to manage
          their workforce tools.
        </p>

        <div className="access-cards">
          <div className="access-card">
            <h2>Employee Login</h2>
            <p>
              Already part of a company? Sign in here to access your portal.
            </p>
            <Link to="/login" className="btn primary-btn">
              Employee Login
            </Link>
          </div>

          <div className="access-card">
            <h2>Company Access</h2>
            <p>
              Already registered? Sign in here to manage your company portal.
            </p>
            <Link to="/login/company" className="btn primary-btn">
              Company Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
