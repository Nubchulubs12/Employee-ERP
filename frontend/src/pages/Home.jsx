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

    </div>
  );
}

export default Home;