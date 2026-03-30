import { useState } from 'react';

function EmployeeForm({ companies, onCreate }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    hireDate: '',
    companyId: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    onCreate({
      ...formData,
      companyId: Number(formData.companyId),
    });

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      hireDate: '',
      companyId: '',
    });
  }

  return (
    <div className="card">
      <h2>Add Employee</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="jobTitle"
          placeholder="Job Title"
          value={formData.jobTitle}
          onChange={handleChange}
        />
        <input
          name="hireDate"
          type="date"
          value={formData.hireDate}
          onChange={handleChange}
        />

        <select
          name="companyId"
          value={formData.companyId}
          onChange={handleChange}
          required
        >
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <button type="submit">Save Employee</button>
      </form>
    </div>
  );
}

export default EmployeeForm;