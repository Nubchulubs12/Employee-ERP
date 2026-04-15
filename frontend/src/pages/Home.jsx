import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
function Home() {
  const navigate = useNavigate();

  const handleCompanies = () => {
    navigate('/companies');
  };

  const handleEmployees = () => {
    navigate('/employees');
  };

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
                 New company? Register your account first. Already registered?
                 Sign in here.
               </p>
               <div className="card-buttons">
                 <Link to="/register" className="btn primary-btn">
                   Register Company
                 </Link>
                 <Link to="/login" className="btn secondary-btn">
                   Company Login
                 </Link>
               </div>
             </div>
           </div>
         </section>
       </div>

  );
}

export default Home;