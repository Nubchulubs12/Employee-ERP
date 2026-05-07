import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TimeSheetGrid from "../components/TimeSheetGrid";
import {
  changeEmployeePassword,
  clockIn,
  clockOut,
  fetchTimeEntries,
  createPtoRequest,
  fetchEmployeePtoRequests,
  fetchEmployeeById,
} from "../api/employeeApi";

function EmployeesPage() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("timeclock");

  const [timeEntries, setTimeEntries] = useState([]);
  const [ptoRequests, setPtoRequests] = useState([]);

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [ptoForm, setPtoForm] = useState({
    startDate: "",
    endDate: "",
    hoursRequested: "",
    reason: "",
  });

  useEffect(() => {
    async function loadTimeEntries() {
      try {
        const data = await fetchTimeEntries(id);
        setTimeEntries(data);
        const openEntry = data.find((entry) => !entry.clockOutTime);
        setIsClockedIn(!!openEntry);
      } catch (err) {
        setError(err.message || "Failed to load time entries");
      }
    }

    if (id) loadTimeEntries();
  }, [id]);

  useEffect(() => {
    async function loadPtoRequests() {
      try {
        const data = await fetchEmployeePtoRequests(id);
        setPtoRequests(data);
      } catch (err) {
        setError(err.message || "Failed to load PTO requests");
      }
    }

    if (id) loadPtoRequests();
  }, [id]);

  useEffect(() => {
    async function loadEmployee() {
      try {
        const data = await fetchEmployeeById(id);
        setEmployee({
          ...data,
          name: `${data.firstName} ${data.lastName}`,
        });
      } catch (err) {
        setError(err.message || "Failed to load employee");
      }
    }

    if (id) loadEmployee();
  }, [id]);

  async function handleClockIn() {
    try {
      const newEntry = await clockIn(id);
      setTimeEntries((prev) => [newEntry, ...prev]);
      setIsClockedIn(true);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to clock in");
    }
  }

  async function handleClockOut() {
    try {
      const updatedEntry = await clockOut(id);

      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
      );

      setIsClockedIn(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to clock out");
    }
  }

  function handlePasswordInputChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await changeEmployeePassword(id, passwordForm);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  }

  function handlePtoInputChange(e) {
    const { name, value } = e.target;
    setPtoForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmitPtoRequest(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!ptoForm.startDate || !ptoForm.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (!ptoForm.hoursRequested || Number(ptoForm.hoursRequested) <= 0) {
      setError("PTO hours requested must be greater than 0.");
      return;
    }

    if (new Date(ptoForm.endDate) < new Date(ptoForm.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      const created = await createPtoRequest(id, ptoForm);

      setPtoRequests((prev) => [created, ...prev]);

      setPtoForm({
        startDate: "",
        endDate: "",
        hoursRequested: "",
        reason: "",
      });

      setMessage("PTO request submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit PTO request");
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setError("");
    setMessage("");
  }

  function getStatusClass(status) {
    if (status === "APPROVED") return "pto-status pto-status-approved";
    if (status === "DENIED") return "pto-status pto-status-denied";
    return "pto-status pto-status-pending";
  }

  if (!employee) {
    return <p>Loading employee info...</p>;
  }

  return (
    <div className="company-page">
      <div className="company-left">
        <h1>Welcome, {employee.name}</h1>

        <p>
          <strong>Email:</strong> {employee.email}
        </p>

        <p>
          <strong>Company:</strong> {employee.companyName || "N/A"}
        </p>

        <div className="employee-tabs">
          <button
            type="button"
            className={`employee-tab${
              activeTab === "timeclock" ? " employee-tab--active" : ""
            }`}
            onClick={() => handleTabChange("timeclock")}
          >
            Time Clock
          </button>

          <button
            type="button"
            className={`employee-tab${
              activeTab === "pto" ? " employee-tab--active" : ""
            }`}
            onClick={() => handleTabChange("pto")}
          >
            Request PTO
          </button>

          <button
            type="button"
            className={`employee-tab${
              activeTab === "password" ? " employee-tab--active" : ""
            }`}
            onClick={() => handleTabChange("password")}
          >
            Change Password
          </button>
        </div>
      </div>

      <div className="company-right">
        {activeTab === "timeclock" && (
          <div className="employee-tab-content">
            <div className="clock-actions">
              {!isClockedIn ? (
                <button type="button" onClick={handleClockIn}>
                  Clock In
                </button>
              ) : (
                <button type="button" onClick={handleClockOut}>
                  Clock Out
                </button>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}

            <h3>Recent Time Entries</h3>
            <TimeSheetGrid timeEntries={timeEntries} />
          </div>
        )}

        {activeTab === "pto" && (
          <div className="employee-tab-content">
            <h2>Request PTO</h2>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <form onSubmit={handleSubmitPtoRequest} className="register-form">
              <p>
                <strong>Available PTO:</strong>{" "}
                {Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs
              </p>

              <label>
                Start Date
                <input
                  type="date"
                  name="startDate"
                  value={ptoForm.startDate}
                  onChange={handlePtoInputChange}
                  required
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  name="endDate"
                  value={ptoForm.endDate}
                  onChange={handlePtoInputChange}
                  required
                />
              </label>

              <label>
                PTO Hours Requested
                <input
                  type="number"
                  name="hoursRequested"
                  value={ptoForm.hoursRequested}
                  onChange={handlePtoInputChange}
                  min="1"
                  step="1"
                  required
                />
              </label>

              <label>
                Reason
                <textarea
                  name="reason"
                  value={ptoForm.reason}
                  onChange={handlePtoInputChange}
                  rows="4"
                  placeholder="Optional reason..."
                />
              </label>

              <button type="submit">Submit PTO Request</button>
            </form>

            <hr />

            <h3>My PTO Requests</h3>

            {ptoRequests.length === 0 ? (
              <p>No PTO requests yet.</p>
            ) : (
              <div className="pto-request-list">
                {ptoRequests.map((request) => (
                  <div key={request.id} className="pto-request-card">
                    <div className="pto-request-card-header">
                      <strong>
                        {request.startDate} — {request.endDate}
                      </strong>

                      <span className={getStatusClass(request.status)}>
                        {request.status}
                      </span>
                    </div>

                    <p>
                      <strong>Hours Requested:</strong>{" "}
                      {Number(request.hoursRequested || 0).toFixed(2)} hrs
                    </p>

                    <p>
                      <strong>Reason:</strong>{" "}
                      {request.reason || "No reason provided"}
                    </p>

                    {request.reviewNote && (
                      <p>
                        <strong>Manager Note:</strong> {request.reviewNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "password" && (
          <div className="employee-tab-content">
            <h2>Change Password</h2>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <form onSubmit={handleChangePassword} className="register-form">
              <label>
                Current Password
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </label>

              <label>
                New Password
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </label>

              <button type="submit">Update Password</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeesPage;