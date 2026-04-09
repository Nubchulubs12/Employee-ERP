import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { registerCompany } from '../api/companyApi';
function Register(){
const navigate = useNavigate();
const[formData, setFormData]=useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    });

const [message, setmessage] =  useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

async function handleSubmit(e) {
  e.preventDefault();

  try {
      const createdCompany = await registerCompany(formData);
      localStorage.setItem("user", JSON.stringify(createdCompany));
      setmessage("Registered successfully!")
    navigate(`/companies/${createdCompany.id}`);
  } catch (err) {
    setError(err.message || "Registration failed.");
  }finally{
      setLoading(false);
      }
}


    return (
              <div className="register-page">
                <div className="register-card">
                  <h1>Register Company</h1>
                  <p className="register-subtext">Create your company account to get started.</p>

                  <form onSubmit={handleSubmit} className="register-form">
                    <label>
                      Company Name
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter company name"
                        required
                      />
                    </label>

                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter company email"
                        required
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                      />
                    </label>

                    <label>
                      Phone
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
                      Address
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter company address"
                      />
                    </label>

                    <button type="submit" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </button>
                  </form>

                  {message && <p className="success-message">{message}</p>}
                  {error && <p className="error-message">{error}</p>}
                </div>
              </div>
            );
          }


export default Register;