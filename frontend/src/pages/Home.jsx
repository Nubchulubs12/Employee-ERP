import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleCompanies = () => {
    navigate('/companies');
  };

  const handleEmployees = () => {
    navigate('/employees');
  };

  return (
    <div>
      <h1>Test for home page</h1>
      <button onClick={handleCompanies}>Company page</button>
      <button onClick={handleEmployees}>Employee page</button>
    </div>
  );
}

export default Home;