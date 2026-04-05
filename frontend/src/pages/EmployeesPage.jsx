import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  changeEmployeePassword,
  clockIn,
  clockOut,
  fetchTimeEntries,
} from "../api/employeeApi";

function EmployeesPage() {
  const { id } = useParams();

  const [timeEntries, setTimeEntries] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

    if (id) {
      loadTimeEntries();
    }
  }, [id]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const parsed = JSON.parse(savedUser);

      if (parsed.userType === "employee" && String(parsed.id) === String(id)) {
        setEmployee(parsed);
      }
    }
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
        prev.map((entry) =>
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      );

      setIsClockedIn(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to clock out");
    }
  }

  function handlePasswordInputChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  if (!employee) {
    return <p>Loading employee info...</p>;
  }

  return (
    <div className="employee-dashboard">
      <h1>Welcome, {employee.name}</h1>

      <p><strong>Email:</strong> {employee.email}</p>
      <p><strong>Company:</strong> {employee.companyName || "N/A"}</p>

      <hr />

      <h2>Time Clock</h2>

      <div className="clock-actions">
        {!isClockedIn ? (
          <button type="button" onClick={handleClockIn}>Clock In</button>
        ) : (
          <button type="button" onClick={handleClockOut}>Clock Out</button>
        )}
      </div>

      <h3>Recent Time Entries</h3>
      <ul>
        {timeEntries.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.workDate}</strong> — In: {entry.clockInTime} — Out: {entry.clockOutTime || "Still clocked in"}
          </li>
        ))}
      </ul>

      <hr />

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
  );
}

export default EmployeesPage;