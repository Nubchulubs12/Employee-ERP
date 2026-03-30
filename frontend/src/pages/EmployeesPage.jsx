import { useEffect, useState } from 'react';
import { fetchCompanies } from '../api/companyApi';
import { createEmployee, deleteEmployee, fetchEmployees } from '../api/employeeApi';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeTable from '../components/EmployeeTable';

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      const [employeeData, companyData] = await Promise.all([
        fetchEmployees(),
        fetchCompanies(),
      ]);

      setEmployees(employeeData);
      setCompanies(companyData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(employee) {
    try {
      await createEmployee(employee);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEmployee(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {companies.length > 0 ? (
        <EmployeeForm companies={companies} onCreate={handleCreate} />
      ) : (
        <div className="card">
          <p>Create a company first before adding employees.</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p>{error}</p>
        </div>
      )}

      <EmployeeTable employees={employees} onDelete={handleDelete} />
    </div>
  );
}

export default EmployeesPage;