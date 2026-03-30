function EmployeeTable({ employees, onDelete }) {
  return (
    <div className="card">
      <h2>Employee List</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Job Title</th>
            <th>Hire Date</th>
            <th>Company</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.firstName} {employee.lastName}</td>
              <td>{employee.email}</td>
              <td>{employee.jobTitle}</td>
              <td>{employee.hireDate || '-'}</td>
              <td>{employee.companyName}</td>
              <td>
                <button onClick={() => onDelete(employee.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;