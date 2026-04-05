import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { fetchCompanyById } from '../api/companyApi';
import { fetchEmployees, createEmployee, deleteEmployee, updateEmployee} from '../api/employeeApi';
import {useNavigate} from "react-router-dom";

function CompaniesPage() {
    const navigate = useNavigate;
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    hireDate: "",
  });
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
    async function loadCompany() {
      try {
        const data = await fetchCompanyById(id);
        setCompany(data);

        setEmployeeForm((prev) => ({
          ...prev,
          companyId: data.id,
        }));
      } catch (err) {
        setError(err.message || "Failed to load company");
      }
    }

    if (id) {
      loadCompany();
    }
  }, [id]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await fetchEmployees(id);
        setEmployees(data);
      } catch (err) {
        setError(err.message || "Failed to load employees");
      }
    }

    if (id) {
      loadEmployees();

    }
  }, [id]);

  function handleEmployeeChange(e) {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditClick(employee) {
    setEditingEmployeeId(employee.id);
    setEditForm({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      jobTitle: employee.jobTitle || "",
      hireDate: employee.hireDate || "",
    });
  }

async function handleUpdateEmployee(e) {
  e.preventDefault();
  setError(null);
  console.log("editingEmployeeId:", editingEmployeeId);
  console.log("editForm:", editForm);

  try {
    const updatedEmployee = await updateEmployee(editingEmployeeId, editForm);

    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === editingEmployeeId ? updatedEmployee : employee
      )
    );

    setEditingEmployeeId(null);
    setEditForm({
      firstName: "",
      lastName: "",
      email: "",
      jobTitle: "",
      hireDate: "",
    });
  } catch (err) {
    setError(err.message || "Failed to update employee");
  }
}

function handleEditChange(e) {
  const { name, value } = e.target;
  setEditForm((prev) => ({
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
if (error) {
  return <p className="error-message">{error}</p>;
}
  if (!company) {
    return <p>Loading company info...</p>;
  }

  return (
        <div className="company-page">
             <div className="company-left">
               <div className="register-card">
                 <h1>{company.name}</h1>
                 <p><strong>Email:</strong> {company.email}</p>
                 <p><strong>Phone:</strong> {company.phone || "N/A"}</p>
                 <p><strong>Address:</strong> {company.address || "N/A"}</p>

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



               </div>
             </div>

             <div className="company-right">
               <div className="employees-card">
                 <h3>Employees</h3>

                 {employees.length === 0 ? (
                   <p>No employees added yet.</p>
                 ) : (
                   <ul className="employee-list">
                     {employees.map((employee) => (
                       <li key={employee.id} className="employee-item">
                         <div className="employee-info">
                           <strong>{employee.firstName} {employee.lastName}</strong>
                           <p>Email: {employee.email}</p>
                           <p>Role: {employee.jobTitle || "No title"}</p>
                            {editingEmployeeId === employee.id  && (
                                                           <>
                                                             <hr />
                                                             <form onSubmit={handleUpdateEmployee} className="register-form">
                                                               <h3>Edit Employee</h3>

                                                               <label>
                                                                 First Name
                                                                 <input
                                                                   type="text"
                                                                   name="firstName"
                                                                   value={editForm.firstName}
                                                                   onChange={handleEditChange}
                                                                 />
                                                               </label>

                                                               <label>
                                                                 Last Name
                                                                 <input
                                                                   type="text"
                                                                   name="lastName"
                                                                   value={editForm.lastName}
                                                                   onChange={handleEditChange}
                                                                 />
                                                               </label>

                                                               <label>
                                                                 Email
                                                                 <input
                                                                   type="email"
                                                                   name="email"
                                                                   value={editForm.email}
                                                                   onChange={handleEditChange}
                                                                 />
                                                               </label>

                                                               <label>
                                                                 Job Title
                                                                 <input
                                                                   type="text"
                                                                   name="jobTitle"
                                                                   value={editForm.jobTitle}
                                                                   onChange={handleEditChange}
                                                                 />
                                                               </label>

                                                               <label>
                                                                 Hire Date
                                                                 <input
                                                                   type="date"
                                                                   name="hireDate"
                                                                   value={editForm.hireDate}
                                                                   onChange={handleEditChange}
                                                                 />
                                                               </label>

                                                               <div className="edit-buttons">
                                                                 <button type="submit">Save Changes</button>
                                                                 <button type="button" onClick={() => setEditingEmployeeId(null)}>
                                                                   Cancel
                                                                 </button>
                                                               </div>
                                                             </form>
                                                           </>
                                                           )}
                         </div>
                         {editingEmployeeId !== employee.id && (
                         <div className="employee-actions">
                           <button type="button" onClick={() => handleEditClick(employee)}>
                             Edit
                           </button>
                           <button type="button" onClick={() => handleDeleteEmployee(employee.id)}>
                             Delete
                           </button>
                         </div>
                         )}
                       </li>
                     ))}
                   </ul>
                 )}

               </div>
             </div>
           </div>

)}

export default CompaniesPage;