import { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { fetchCompanyById } from '../api/companyApi';
import {
  fetchEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  fetchTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
} from '../api/employeeApi';
import MiniTimeGrid from '../components/MiniTimeGrid';

function CompaniesPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", email: "", jobTitle: "", hireDate: "", hourlyRate: "",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);

  const [editingTimeEntryId, setEditingTimeEntryId] = useState(null);
  const [timeForm, setTimeForm] = useState({ clockInTime: "", clockOutTime: "" });

  const [employeeForm, setEmployeeForm] = useState({
    firstName: "", lastName: "", email: "", password: "", jobTitle: "", hireDate: "", companyId: "", hourlyRate: "",
  });
  const [payrollPeriodType, setPayrollPeriodType] = useState("weekly");
    const [payrollStartDate, setPayrollStartDate] = useState("");


  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await fetchCompanyById(id);
        setCompany(data);
        setEmployeeForm((prev) => ({ ...prev, companyId: data.id }));
      } catch (err) {
        setError(err.message || "Failed to load company");
      }
    }
    if (id) loadCompany();
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
    if (id) loadEmployees();
  }, [id]);


  function handleEmployeeChange(e) {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await createEmployee(employeeForm);
      setEmployees((prev) => [...prev, created]);
      setEmployeeForm({ firstName: "", lastName: "", email: "", password: "", jobTitle: "", hireDate: "", companyId: company.id, hourlyRate: "",});
    } catch (err) {
      setError(err.message || "Failed to create employee");
    }
  }

  function handleEditClick(employee) {
    setEditingEmployeeId(employee.id);
    setEditForm({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      jobTitle: employee.jobTitle || "",
      hireDate: employee.hireDate || "",
      hourlyRate: employee.hourlyRate || "",
    });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateEmployee(e) {
    e.preventDefault();
    try {
      const updated = await updateEmployee(editingEmployeeId, editForm);
      setEmployees((prev) => prev.map((emp) => (emp.id === editingEmployeeId ? updated : emp)));
      setEditingEmployeeId(null);
      setEditForm({ firstName: "", lastName: "", email: "", jobTitle: "", hireDate: "", hourlyRate: ""});
    } catch (err) {
      setError(err.message || "Failed to update employee");
    }
  }

  async function handleDeleteEmployee(employeeId) {
    try {
      await deleteEmployee(employeeId);
      setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(null);
        setTimeEntries([]);
      }
    } catch (err) {
      setError(err.message || "Failed to delete employee");
    }
  }

  function calculateHours(entry) {
    if (!entry.clockInTime || !entry.clockOutTime) return 0;

    const clockIn = new Date(entry.clockInTime);
    const clockOut = new Date(entry.clockOutTime);

    if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime())) return 0;

    return (clockOut - clockIn) / (1000 * 60 * 60);
  }

  function calculatePayroll(entries, hourlyRate) {
    const totalHours = entries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);
    const rate = Number(hourlyRate || 0);
    const grossPay = (regularHours * rate) + (overtimeHours * rate * 1.5);

    return {
      totalHours,
      regularHours,
      overtimeHours,
      grossPay,
    };
  }


  async function handleManageTime(employeeId) {
    try {
      setSelectedEmployeeId(employeeId);
      setEditingEmployeeId(null);
      setEditingTimeEntryId(null);
      const data = await fetchTimeEntries(employeeId);
      setTimeEntries(data);
    } catch (err) {
      setError(err.message || "Failed to load time entries");
    }
  }

  function handleCloseTimeManager() {
    setSelectedEmployeeId(null);
    setEditingTimeEntryId(null);
    setTimeEntries([]);
  }

  function handleEditTimeClick(entry) {
    setEditingTimeEntryId(entry.id);
    setTimeForm({
      clockInTime: entry.clockInTime ? entry.clockInTime.slice(0, 16) : "",
      clockOutTime: entry.clockOutTime ? entry.clockOutTime.slice(0, 16) : "",
    });
  }

  function handleTimeFormChange(e) {
    const { name, value } = e.target;
    setTimeForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateTimeEntry(e) {
    e.preventDefault();
    try {
      const updated = await updateTimeEntry(editingTimeEntryId, {
        clockInTime: timeForm.clockInTime,
        clockOutTime: timeForm.clockOutTime || null,
      });
      setTimeEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setEditingTimeEntryId(null);
      setTimeForm({ clockInTime: "", clockOutTime: "" });
    } catch (err) {
      setError(err.message || "Failed to update time entry");
    }
  }

  async function handleDeleteTimeEntry(entryId) {
    if (!window.confirm("Delete this time entry?")) return;
    try {
      await deleteTimeEntry(entryId);
      setTimeEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      setError(err.message || "Failed to delete time entry");
    }
  }
   function calculatePayroll(entries, hourlyRate) {
      const totalHours = entries.reduce(
        (sum, entry) => sum + calculateHours(entry),
        0
      );

      const regularHours = Math.min(totalHours, 40);
      const overtimeHours = Math.max(totalHours - 40, 0);
      const rate = Number(hourlyRate || 0);
      const grossPay = regularHours * rate + overtimeHours * rate * 1.5;

      return {
        totalHours,
        regularHours,
        overtimeHours,
        grossPay,
      };
    }

    function toDateOnly(date) {
      return date.toISOString().split("T")[0];
    }

    function addDays(date, days) {
      const copy = new Date(date);
      copy.setDate(copy.getDate() + days);
      return copy;
    }

    function getPayrollPeriod() {
      const start = payrollStartDate
        ? new Date(`${payrollStartDate}T00:00:00`)
        : new Date();

      const end = addDays(start, payrollPeriodType === "weekly" ? 6 : 13);

      return {
        start,
        end,
        startText: toDateOnly(start),
        endText: toDateOnly(end),
      };
    }

    function isEntryInPayrollPeriod(entry, start, end) {
      if (!entry.clockInTime) return false;

      const entryDate = new Date(entry.clockInTime);
      const startDate = new Date(start);
      const endDate = new Date(end);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      return entryDate >= startDate && entryDate <= endDate;
    }

    function getPayrollEntries(entries) {
      const period = getPayrollPeriod();

      return entries.filter((entry) =>
        isEntryInPayrollPeriod(entry, period.start, period.end)
      );
    }

  if (error) return <p className="error-message">{error}</p>;
  if (!company) return <p>Loading company info...</p>;

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

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
            <label>First Name<input type="text" name="firstName" value={employeeForm.firstName} onChange={handleEmployeeChange} required /></label>
            <label>Last Name<input type="text" name="lastName" value={employeeForm.lastName} onChange={handleEmployeeChange} required /></label>
            <label>Email<input type="email" name="email" value={employeeForm.email} onChange={handleEmployeeChange} required /></label>
            <label>Password<input type="password" name="password" value={employeeForm.password} onChange={handleEmployeeChange} required /></label>
            <label>Job Title<input type="text" name="jobTitle" value={employeeForm.jobTitle} onChange={handleEmployeeChange} /></label>
            <label>Hire Date<input type="date" name="hireDate" value={employeeForm.hireDate} onChange={handleEmployeeChange} /></label>
            <label>Hourly Rate<input type="number" name="hourlyRate" value={employeeForm.hourlyRate} onChange={handleEmployeeChange} /></label>
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


                    {editingEmployeeId === employee.id && (
                      <>
                        <hr />
                        <form onSubmit={handleUpdateEmployee} className="register-form">
                          <h3>Edit Employee</h3>
                          <label>First Name<input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} /></label>
                          <label>Last Name<input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} /></label>
                          <label>Email<input type="email" name="email" value={editForm.email} onChange={handleEditChange} /></label>
                          <label>Job Title<input type="text" name="jobTitle" value={editForm.jobTitle} onChange={handleEditChange} /></label>
                          <label>Hire Date<input type="date" name="hireDate" value={editForm.hireDate} onChange={handleEditChange} /></label>
                          <label>Hourly Rate<input type="number" name="hourlyRate" value={editForm.hourlyRate} onChange={handleEditChange} /></label>
                          <div className="edit-buttons">
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setEditingEmployeeId(null)}>Cancel</button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>


                  {editingEmployeeId !== employee.id && selectedEmployeeId !== employee.id && (
                    <div className="employee-actions">
                      <button type="button" onClick={() => handleManageTime(employee.id)}>Manage Time</button>
                      <button type="button" onClick={() => handleEditClick(employee)}>Edit</button>
                      <button type="button" onClick={() => handleDeleteEmployee(employee.id)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>


        {selectedEmployeeId && selectedEmployee && (
          <div className="time-manager-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                Time Entries — {selectedEmployee.firstName} {selectedEmployee.lastName}
              </h3>
              <button
                type="button"
                className="mini-btn mini-btn-cancel"
                onClick={handleCloseTimeManager}
              >
                ✕ Close
              </button>
            </div>


            {editingTimeEntryId && (
              <form onSubmit={handleUpdateTimeEntry} className="register-form time-edit-form">
                <h4>Edit Entry</h4>
                <label>
                  Clock In
                  <input type="datetime-local" name="clockInTime" value={timeForm.clockInTime} onChange={handleTimeFormChange} required />
                </label>
                <label>
                  Clock Out
                  <input type="datetime-local" name="clockOutTime" value={timeForm.clockOutTime} onChange={handleTimeFormChange} />
                </label>
                <div className="edit-buttons">
                  <button type="submit">Save Time</button>
                  <button type="button" onClick={() => setEditingTimeEntryId(null)}>Cancel</button>
                </div>
              </form>
            )}


            {timeEntries.length === 0 ? (
              <p>No time entries found.</p>
            ) : (
                <>
                                <MiniTimeGrid
                                  timeEntries={timeEntries}
                                  onEdit={handleEditTimeClick}
                                  onDelete={handleDeleteTimeEntry}
                                />

                                {(() => {
                                  const period = getPayrollPeriod();
                                  const payrollEntries = getPayrollEntries(timeEntries);

                                  const payroll = calculatePayroll(
                                    payrollEntries,
                                    selectedEmployee.hourlyRate
                                  );

                                  return (
                                    <div className="payroll-summary">
                                      <div className="payroll-summary-header">
                                        <h4>Payroll Summary</h4>

                                        <div className="payroll-controls">
                                          <button
                                            type="button"
                                            className={
                                              payrollPeriodType === "weekly"
                                                ? "active-payroll-btn"
                                                : ""
                                            }
                                            onClick={() => setPayrollPeriodType("weekly")}
                                          >
                                            Weekly
                                          </button>

                                          <button
                                            type="button"
                                            className={
                                              payrollPeriodType === "biweekly"
                                                ? "active-payroll-btn"
                                                : ""
                                            }
                                            onClick={() => setPayrollPeriodType("biweekly")}
                                          >
                                            Bi-Weekly
                                          </button>

                                          <input
                                            type="date"
                                            value={payrollStartDate}
                                            onChange={(e) =>
                                              setPayrollStartDate(e.target.value)
                                            }
                                          />
                                        </div>
                                      </div>

                                      <p>
                                        <strong>Pay Period:</strong> {period.startText} —{" "}
                                        {period.endText}
                                      </p>

                                      <p>
                                        <strong>Total Hours:</strong>{" "}
                                        {payroll.totalHours.toFixed(2)}
                                      </p>

                                      <p>
                                        <strong>Regular Hours:</strong>{" "}
                                        {payroll.regularHours.toFixed(2)}
                                      </p>

                                      <p>
                                        <strong>Overtime Hours:</strong>{" "}
                                        {payroll.overtimeHours.toFixed(2)}
                                      </p>

                                      <p>
                                        <strong>Hourly Rate:</strong> $
                                        {Number(selectedEmployee.hourlyRate || 0).toFixed(2)}
                                        /hr
                                      </p>

                                      <p>
                                        <strong>Estimated Gross Pay:</strong> $
                                        {payroll.grossPay.toFixed(2)}
                                      </p>
                                    </div>
                                  );
                                })()}
                              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompaniesPage;