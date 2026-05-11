import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { fetchCompanyById, updateCompanySettings } from '../api/companyApi';
import {
  fetchEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  fetchTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  fetchCompanyPtoRequests,
  approvePtoRequest,
  denyPtoRequest,
} from '../api/employeeApi';
import MiniTimeGrid from '../components/MiniTimeGrid';

function CompaniesPage() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeCompanyTab, setActiveCompanyTab] = useState("employees");

  const [companySettingsForm, setCompanySettingsForm] = useState({
    payrollType: "WEEKLY",
    payday: "FRIDAY",
    biweeklyStartDate: "",
  });

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    hireDate: "",
    payType: "HOURLY",
    hourlyRate: "",
    salaryRate: "",
    ptoBalanceHours: "",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);

  const [editingTimeEntryId, setEditingTimeEntryId] = useState(null);
  const [timeForm, setTimeForm] = useState({
    clockInTime: "",
    clockOutTime: "",
  });

  const [employeeForm, setEmployeeForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    jobTitle: "",
    hireDate: "",
    companyId: "",
    payType: "HOURLY",
    hourlyRate: "",
    salaryRate: "",
    ptoBalanceHours: "",
  });

  const [ptoRequests, setPtoRequests] = useState([]);
  const [ptoReviewNotes, setPtoReviewNotes] = useState({});
  const [showPtoManager, setShowPtoManager] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await fetchCompanyById(id);
        setCompany(data);
        setEmployeeForm((prev) => ({ ...prev, companyId: data.id }));
        setCompanySettingsForm({
          payrollType: data.payrollType || "WEEKLY",
          payday: data.payday || "FRIDAY",
          biweeklyStartDate: data.biweeklyStartDate || "",
        });
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

  function handleCompanyTabChange(tab) {
    setActiveCompanyTab(tab);
    setMessage("");
    setError("");
    setShowPtoManager(false);
    setSelectedEmployeeId(null);
    setEditingEmployeeId(null);
    setEditingTimeEntryId(null);
  }

  function handleCompanySettingsChange(e) {
    const { name, value } = e.target;
    setCompanySettingsForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveCompanySettings(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const updated = await updateCompanySettings(id, companySettingsForm);
      setCompany(updated);
      setCompanySettingsForm({
        payrollType: updated.payrollType || "WEEKLY",
        payday: updated.payday || "FRIDAY",
        biweeklyStartDate: updated.biweeklyStartDate || "",
      });
      setMessage("Company settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save company settings");
    }
  }

  async function handleManagePto() {
    try {
      setShowPtoManager(true);
      setSelectedEmployeeId(null);
      setEditingEmployeeId(null);
      setEditingTimeEntryId(null);
      const refreshedEmployees = await fetchEmployees(id);
      setEmployees(refreshedEmployees);
      const data = await fetchCompanyPtoRequests(id);
      setPtoRequests(data);
    } catch (err) {
      setError(err.message || "Failed to load PTO requests");
    }
  }

  function handleClosePtoManager() {
    setShowPtoManager(false);
  }

  function handleEmployeeChange(e) {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const created = await createEmployee(employeeForm);
      setEmployees((prev) => [...prev, created]);
      setEmployeeForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        jobTitle: "",
        hireDate: "",
        companyId: company.id,
        payType: "HOURLY",
        hourlyRate: "",
        salaryRate: "",
        ptoBalanceHours: "",
      });
      setMessage("Employee added successfully.");
    } catch (err) {
      setError(err.message || "Failed to create employee");
    }
  }

  function handleEditClick(employee) {
    setShowPtoManager(false);
    setSelectedEmployeeId(null);
    setEditingTimeEntryId(null);
    setEditingEmployeeId(employee.id);
    setEditForm({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      jobTitle: employee.jobTitle || "",
      hireDate: employee.hireDate || "",
      payType: employee.payType || "HOURLY",
      hourlyRate: employee.hourlyRate || "",
      salaryRate: employee.salaryRate || "",
      ptoBalanceHours: employee.ptoBalanceHours || "",
    });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateEmployee(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await updateEmployee(editingEmployeeId, editForm);
      const refreshedEmployees = await fetchEmployees(id);
      setEmployees(refreshedEmployees);
      setEditingEmployeeId(null);
      setEditForm({
        firstName: "",
        lastName: "",
        email: "",
        jobTitle: "",
        hireDate: "",
        payType: "HOURLY",
        hourlyRate: "",
        salaryRate: "",
        ptoBalanceHours: "",
      });
      setMessage("Employee updated successfully.");
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

  async function handleManageTime(employeeId) {
    try {
      setSelectedEmployeeId(employeeId);
      setShowPtoManager(false);
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
      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );
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

  function calculateHours(entry) {
    if (!entry.clockInTime || !entry.clockOutTime) return 0;
    const clockIn = new Date(entry.clockInTime);
    const clockOut = new Date(entry.clockOutTime);
    if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime())) return 0;
    return (clockOut - clockIn) / (1000 * 60 * 60);
  }

  function calculatePayroll(entries, employee) {
    const totalHours = entries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);

    if (employee.payType === "SALARY") {
      const annualSalary = Number(employee.salaryRate || 0);
      const period = getPayrollPeriod();
      const days = (new Date(period.end) - new Date(period.start)) / (1000 * 60 * 60 * 24) + 1;
      const grossPay = (annualSalary / 365) * days;
      return { totalHours, regularHours, overtimeHours: 0, grossPay };
    }

    const rate = Number(employee.hourlyRate || 0);
    const grossPay = regularHours * rate + overtimeHours * rate * 1.5;
    return { totalHours, regularHours, overtimeHours, grossPay };
  }

  function toDateOnly(date) {
    return date.toISOString().split("T")[0];
  }

  function addDays(date, days) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function getMostRecentWeekday(targetDayName) {
    const dayMap = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
    const targetDay = dayMap[targetDayName || "FRIDAY"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today.getDay() - targetDay + 7) % 7;
    return addDays(today, -diff);
  }

  function getPayrollPeriod() {
    const payrollType = companySettingsForm.payrollType || "WEEKLY";
    if (payrollType === "BIWEEKLY") {
      const start = companySettingsForm.biweeklyStartDate
        ? new Date(`${companySettingsForm.biweeklyStartDate}T00:00:00`)
        : new Date();
      const end = addDays(start, 13);
      return { start, end, startText: toDateOnly(start), endText: toDateOnly(end) };
    }
    const payday = companySettingsForm.payday || "FRIDAY";
    const paydayDate = getMostRecentWeekday(payday);
    const start = addDays(paydayDate, -6);
    return { start, end: paydayDate, startText: toDateOnly(start), endText: toDateOnly(paydayDate) };
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
    return entries.filter((entry) => isEntryInPayrollPeriod(entry, period.start, period.end));
  }

  function handlePtoNoteChange(requestId, value) {
    setPtoReviewNotes((prev) => ({ ...prev, [requestId]: value }));
  }

  async function handleApprovePto(requestId) {
    try {
      const updated = await approvePtoRequest(requestId, ptoReviewNotes[requestId] || "");
      setPtoRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      const refreshedEmployees = await fetchEmployees(id);
      setEmployees(refreshedEmployees);
      setPtoReviewNotes((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err) {
      setError(err.message || "Failed to approve PTO request");
    }
  }

  async function handleDenyPto(requestId) {
    try {
      const updated = await denyPtoRequest(requestId, ptoReviewNotes[requestId] || "");
      setPtoRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setPtoReviewNotes((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err) {
      setError(err.message || "Failed to deny PTO request");
    }
  }

  function getStatusClass(status) {
    if (status === "APPROVED") return "pto-status pto-status-approved";
    if (status === "DENIED") return "pto-status pto-status-denied";
    return "pto-status pto-status-pending";
  }

  // ── Pay type checkbox helpers ──
  function PayTypeCheckboxes({ payType, onChange }) {
    return (
      <div>
        <label style={{ marginBottom: 4, display: "block" }}>Pay Type</label>
        <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={payType === "HOURLY"}
              onChange={() => onChange("HOURLY")}
            />
            Hourly
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={payType === "SALARY"}
              onChange={() => onChange("SALARY")}
            />
            Salary
          </label>
        </div>
      </div>
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

          <div className="employee-tabs">
            <button type="button" className={`employee-tab${activeCompanyTab === "employees" ? " employee-tab--active" : ""}`} onClick={() => handleCompanyTabChange("employees")}>
              Employees
            </button>
            <button type="button" className={`employee-tab${activeCompanyTab === "management" ? " employee-tab--active" : ""}`} onClick={() => handleCompanyTabChange("management")}>
              Employee Management
            </button>
            <button type="button" className={`employee-tab${activeCompanyTab === "settings" ? " employee-tab--active" : ""}`} onClick={() => handleCompanyTabChange("settings")}>
              Company Settings
            </button>
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      <div className="company-right">

        {/* ── Employees tab ── */}
        {activeCompanyTab === "employees" && (
          <>
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
                        <p>
                          Pay:{" "}
                          {employee.payType === "SALARY"
                            ? `$${Number(employee.salaryRate || 0).toLocaleString()}/yr (Salary)`
                            : `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr (Hourly)`}
                        </p>
                        <p>PTO Balance: {Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs</p>

                        {/* Edit employee form */}
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

                              <PayTypeCheckboxes
                                payType={editForm.payType}
                                onChange={(type) => setEditForm((prev) => ({ ...prev, payType: type, hourlyRate: "", salaryRate: "" }))}
                              />

                              {editForm.payType === "HOURLY" && (
                                <label>
                                  Hourly Rate ($/hr)
                                  <input type="number" name="hourlyRate" value={editForm.hourlyRate} onChange={handleEditChange} min="0" step="0.01" placeholder="0.00" />
                                </label>
                              )}
                              {editForm.payType === "SALARY" && (
                                <label>
                                  Annual Salary ($)
                                  <input type="number" name="salaryRate" value={editForm.salaryRate} onChange={handleEditChange} min="0" step="0.01" placeholder="0.00" />
                                </label>
                              )}

                              <label>
                                PTO Balance Hours
                                <input type="number" name="ptoBalanceHours" value={editForm.ptoBalanceHours} onChange={handleEditChange} min="0" step="1" />
                              </label>

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
                          <button type="button" onClick={handleManagePto}>Manage PTO</button>
                          <button type="button" onClick={() => handleEditClick(employee)}>Edit</button>
                          <button type="button" onClick={() => handleDeleteEmployee(employee.id)}>Delete</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PTO manager */}
            {showPtoManager && (
              <div className="time-manager-panel">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>PTO Requests</h3>
                  <button type="button" className="mini-btn mini-btn-cancel" onClick={handleClosePtoManager}>✕ Close</button>
                </div>
                {ptoRequests.length === 0 ? (
                  <p>No PTO requests yet.</p>
                ) : (
                  <div className="pto-request-list">
                    {ptoRequests.map((request) => (
                      <div key={request.id} className="pto-request-card">
                        <div className="pto-request-card-header">
                          <strong>{request.employeeName}</strong>
                          <span className={getStatusClass(request.status)}>{request.status}</span>
                        </div>
                        <p><strong>Dates:</strong> {request.startDate} — {request.endDate}</p>
                        <p><strong>Hours Requested:</strong> {Number(request.hoursRequested || 0).toFixed(2)} hrs</p>
                        <p><strong>Available PTO:</strong> {Number(request.ptoBalanceHours || 0).toFixed(2)} hrs</p>
                        <p><strong>Reason:</strong> {request.reason || "No reason provided"}</p>
                        {request.reviewNote && <p><strong>Manager Note:</strong> {request.reviewNote}</p>}
                        {request.status === "PENDING" && (
                          <>
                            <label>
                              Review Note
                              <textarea value={ptoReviewNotes[request.id] || ""} onChange={(e) => handlePtoNoteChange(request.id, e.target.value)} rows="2" placeholder="Optional note..." />
                            </label>
                            <div className="edit-buttons">
                              <button type="button" onClick={() => handleApprovePto(request.id)}>Approve</button>
                              <button type="button" onClick={() => handleDenyPto(request.id)}>Deny</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Time manager */}
            {selectedEmployeeId && selectedEmployee && (
              <div className="time-manager-panel">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Time Entries — {selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                  <button type="button" className="mini-btn mini-btn-cancel" onClick={handleCloseTimeManager}>✕ Close</button>
                </div>

                {editingTimeEntryId && (
                  <form onSubmit={handleUpdateTimeEntry} className="register-form time-edit-form">
                    <h4>Edit Entry</h4>
                    <label>Clock In<input type="datetime-local" name="clockInTime" value={timeForm.clockInTime} onChange={handleTimeFormChange} required /></label>
                    <label>Clock Out<input type="datetime-local" name="clockOutTime" value={timeForm.clockOutTime} onChange={handleTimeFormChange} /></label>
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
                    <MiniTimeGrid timeEntries={timeEntries} onEdit={handleEditTimeClick} onDelete={handleDeleteTimeEntry} />

                    {(() => {
                      const period = getPayrollPeriod();
                      const payrollEntries = getPayrollEntries(timeEntries);
                      const payroll = calculatePayroll(payrollEntries, selectedEmployee);
                      return (
                        <div className="payroll-summary">
                          <div className="payroll-summary-header">
                            <h4>Payroll Summary</h4>
                            <p><strong>Payroll Type:</strong> {companySettingsForm.payrollType === "BIWEEKLY" ? "Bi-Weekly" : "Weekly"}</p>
                          </div>
                          <p><strong>Pay Period:</strong> {period.startText} — {period.endText}</p>
                          <p><strong>Payday:</strong> {companySettingsForm.payday || "FRIDAY"}</p>
                          <p><strong>Total Hours:</strong> {payroll.totalHours.toFixed(2)}</p>
                          <p><strong>Regular Hours:</strong> {payroll.regularHours.toFixed(2)}</p>
                          {selectedEmployee.payType !== "SALARY" && (
                            <p><strong>Overtime Hours:</strong> {payroll.overtimeHours.toFixed(2)}</p>
                          )}
                          <p>
                            <strong>
                              {selectedEmployee.payType === "SALARY" ? "Annual Salary:" : "Hourly Rate:"}
                            </strong>{" "}
                            {selectedEmployee.payType === "SALARY"
                              ? `$${Number(selectedEmployee.salaryRate || 0).toLocaleString()}/yr`
                              : `$${Number(selectedEmployee.hourlyRate || 0).toFixed(2)}/hr`}
                          </p>
                          <p><strong>Estimated Gross Pay:</strong> ${payroll.grossPay.toFixed(2)}</p>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Employee Management tab ── */}
        {activeCompanyTab === "management" && (
          <div className="employees-card">
            <h3>Add Employee</h3>
            <form onSubmit={handleAddEmployee} className="register-form">
              <label>First Name<input type="text" name="firstName" value={employeeForm.firstName} onChange={handleEmployeeChange} required /></label>
              <label>Last Name<input type="text" name="lastName" value={employeeForm.lastName} onChange={handleEmployeeChange} required /></label>
              <label>Email<input type="email" name="email" value={employeeForm.email} onChange={handleEmployeeChange} required /></label>
              <label>Password<input type="password" name="password" value={employeeForm.password} onChange={handleEmployeeChange} required /></label>
              <label>Job Title<input type="text" name="jobTitle" value={employeeForm.jobTitle} onChange={handleEmployeeChange} /></label>
              <label>Hire Date<input type="date" name="hireDate" value={employeeForm.hireDate} onChange={handleEmployeeChange} /></label>

              <PayTypeCheckboxes
                payType={employeeForm.payType}
                onChange={(type) => setEmployeeForm((prev) => ({ ...prev, payType: type, hourlyRate: "", salaryRate: "" }))}
              />

              {employeeForm.payType === "HOURLY" && (
                <label>
                  Hourly Rate ($/hr)
                  <input type="number" name="hourlyRate" value={employeeForm.hourlyRate} onChange={handleEmployeeChange} min="0" step="0.01" placeholder="0.00" />
                </label>
              )}
              {employeeForm.payType === "SALARY" && (
                <label>
                  Annual Salary ($)
                  <input type="number" name="salaryRate" value={employeeForm.salaryRate} onChange={handleEmployeeChange} min="0" step="0.01" placeholder="0.00" />
                </label>
              )}

              <label>
                PTO Balance Hours
                <input type="number" name="ptoBalanceHours" value={employeeForm.ptoBalanceHours} onChange={handleEmployeeChange} min="0" step="1" />
              </label>

              <button type="submit">Add Employee</button>
            </form>
          </div>
        )}

        {/* ── Settings tab ── */}
        {activeCompanyTab === "settings" && (
          <>
            <div className="employees-card">
              <h3>Company Settings</h3>
              <form onSubmit={handleSaveCompanySettings} className="register-form">
                <label>
                  Payroll Type
                  <select name="payrollType" value={companySettingsForm.payrollType} onChange={handleCompanySettingsChange}>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-Weekly</option>
                  </select>
                </label>

                {companySettingsForm.payrollType === "WEEKLY" && (
                  <label>
                    Payday
                    <select name="payday" value={companySettingsForm.payday} onChange={handleCompanySettingsChange}>
                      <option value="MONDAY">Monday</option>
                      <option value="TUESDAY">Tuesday</option>
                      <option value="WEDNESDAY">Wednesday</option>
                      <option value="THURSDAY">Thursday</option>
                      <option value="FRIDAY">Friday</option>
                      <option value="SATURDAY">Saturday</option>
                      <option value="SUNDAY">Sunday</option>
                    </select>
                  </label>
                )}

                {companySettingsForm.payrollType === "BIWEEKLY" && (
                  <>
                    <label>
                      Pay Period Start Date
                      <input type="date" name="biweeklyStartDate" value={companySettingsForm.biweeklyStartDate} onChange={handleCompanySettingsChange} required />
                    </label>
                    <label>
                      Payday
                      <select name="payday" value={companySettingsForm.payday} onChange={handleCompanySettingsChange}>
                        <option value="MONDAY">Monday</option>
                        <option value="TUESDAY">Tuesday</option>
                        <option value="WEDNESDAY">Wednesday</option>
                        <option value="THURSDAY">Thursday</option>
                        <option value="FRIDAY">Friday</option>
                        <option value="SATURDAY">Saturday</option>
                        <option value="SUNDAY">Sunday</option>
                      </select>
                    </label>
                  </>
                )}

                <button type="submit">Save Settings</button>
              </form>
            </div>

            <div className="employees-card">
              <h3>Current Payroll Settings</h3>
              <div className="payroll-summary">
                <p><strong>Payroll Type:</strong> {companySettingsForm.payrollType === "BIWEEKLY" ? "Bi-Weekly" : "Weekly"}</p>
                <p><strong>Payday:</strong> {companySettingsForm.payday}</p>
                {companySettingsForm.payrollType === "BIWEEKLY" && (
                  <p><strong>Bi-Weekly Start Date:</strong> {companySettingsForm.biweeklyStartDate || "Not set"}</p>
                )}
                {(() => {
                  const period = getPayrollPeriod();
                  return <p><strong>Current Pay Period:</strong> {period.startText} — {period.endText}</p>;
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CompaniesPage;