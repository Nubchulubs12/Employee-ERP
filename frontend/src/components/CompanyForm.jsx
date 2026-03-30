import { useState } from 'react';

function CompanyForm({ onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onCreate(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  }

  return (
    <div className="card">
      <h2>Add Company</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Company Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          placeholder="Company Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />
        <button type="submit">Save Company</button>
      </form>
    </div>
  );
}

export default CompanyForm;