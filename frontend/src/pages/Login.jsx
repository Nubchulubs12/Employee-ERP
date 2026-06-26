import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

function Login({ defaultType = "employee" }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/health`).catch(() => {});
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user.userType === "employee") navigate(`/employees/${user.id}`, { replace: true });
      else if (user.userType === "company") navigate(`/companies/${user.companyId}`, { replace: true });
    }
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser({ ...formData, userType: defaultType });

      if (user.userType !== defaultType) {
        setError(
          defaultType === "employee"
            ? "This account is a company account. Please use Company Login."
            : "This account is an employee account. Please use Employee Login."
        );
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));

      if (user.userType === "company") {
        navigate(`/companies/${user.companyId}`);
      } else {
        navigate(`/employees/${user.id}`);
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>{defaultType === "employee" ? "Employee Login" : "Company Login"}</h1>

        <form onSubmit={handleSubmit} className="register-form">
          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <Link
          className="forgot-password-link"
          to="/forgot-password"
          state={{ accountType: defaultType === "company" ? "COMPANY" : "EMPLOYEE" }}
        >
          Forgot password?
        </Link>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

export default Login;
