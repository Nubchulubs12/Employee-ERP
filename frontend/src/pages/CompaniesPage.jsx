import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { createEmployee, deleteEmployee } from '../api/employeeApi';

function CompaniesPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [employeeForm, setEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    jobTitle: "",
    hireDate: "",
    companyId: "",
  });

  useEffect(() => {
    const savedCompany = localStorage.getItem("company");

    if (savedCompany) {
      const parsed = JSON.parse(savedCompany);

      if (String(parsed.id) === String(id)) {
        setCompany(parsed);
        setEmployeeForm((prev) => ({
          ...prev,
          companyId: parsed.id,
        }));
      }
    }
  }, [id]);

  function handleEmployeeChange(e) {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    setError("");

    try {
      const createdEmployee = await createEmployee(employeeForm);
      setEmployees((prev) => [...prev, createdEmployee]);

      setEmployeeForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        jobTitle: "",
        hireDate: "",
        companyId: company.id,
      });
    } catch (err) {
      setError(err.message || "Failed to create employee");
    }
  }

  async function handleDeleteEmployee(employeeId) {
    try {
      await deleteEmployee(employeeId);
      setEmployees((prev) => prev.filter((employee) => employee.id !== employeeId));
    } catch (err) {
      setError(err.message || "Failed to delete employee");
    }
  }

  if (!company) {
    return <p>Loading company info...</p>;
  }

  return (
    <div className="company-dashboard">
      <h1>{company.name}</h1>
      <p><strong>Email:</strong> {company.email}</p>
      <p><strong>Phone:</strong> {company.phone}</p>
      <p><strong>Address:</strong> {company.address}</p>

      <hr />

      <h2>Employee Management</h2>

      <form onSubmit={handleAddEmployee} className="register-form">
        <label>
          First Name
          <input
            type="text"
            name="firstName"
            value={employeeForm.firstName}
            onChange={handleEmployeeChange}
            required
          />
        </label>

        <label>
          Last Name
          <input
            type="text"
            name="lastName"
            value={employeeForm.lastName}
            onChange={handleEmployeeChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={employeeForm.email}
            onChange={handleEmployeeChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={employeeForm.password}
            onChange={handleEmployeeChange}
            required
          />
        </label>

        <label>
          Job Title
          <input
            type="text"
            name="jobTitle"
            value={employeeForm.jobTitle}
            onChange={handleEmployeeChange}
          />
        </label>

        <label>
          Hire Date
          <input
            type="date"
            name="hireDate"
            value={employeeForm.hireDate}
            onChange={handleEmployeeChange}
          />
        </label>

        <button type="submit">Add Employee</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <hr />

      <h3>Employees</h3>

      {employees.length === 0 ? (
        <p>No employees added yet.</p>
      ) : (
        <ul>
          {employees.map((employee) => (
            <li key={employee.id}>
              <strong>{employee.firstName} {employee.lastName}</strong> — {employee.email} — {employee.jobTitle} — {employee.companyName}
              <button onClick={() => handleDeleteEmployee(employee.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompaniesPage;