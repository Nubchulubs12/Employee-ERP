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
  updateEmployeeProfile,
} from "../api/employeeApi";
import { fetchCompanyById } from "../api/companyApi";
import DocumentsPanel from '../components/DocumentsPanel';

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDateStr(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getMostRecentWeekday(targetDayName) {
  const dayMap = { SUNDAY:0, MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6 };
  const targetDay = dayMap[targetDayName || "FRIDAY"];
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = (today.getDay() - targetDay + 7) % 7;
  return addDays(today, -diff);
}

function getNextWeekday(targetDayName) {
  const dayMap = { SUNDAY:0, MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6 };
  const targetDay = dayMap[targetDayName || "FRIDAY"];
  const today = new Date();
  today.setHours(0,0,0,0);
  const diff = (targetDay - today.getDay() + 7) % 7 || 7;
  return addDays(today, diff);
}

function getPayrollInfo(company) {
  if (!company) return null;
  const payrollType = company.payrollType || "WEEKLY";
  const payday = company.payday || "FRIDAY";
  let periodStart, periodEnd, nextPayday;
  if (payrollType === "BIWEEKLY" && company.biweeklyStartDate) {
    const start = new Date(`${company.biweeklyStartDate}T00:00:00`);
    const end = addDays(start, 13);
    periodStart = start;
    periodEnd = end;
    nextPayday = getNextWeekday(payday);
  } else {
    const paydayDate = getMostRecentWeekday(payday);
    periodStart = addDays(paydayDate, -6);
    periodEnd = paydayDate;
    nextPayday = addDays(paydayDate, 7);
  }
  return { periodStart, periodEnd, nextPayday, payrollType, payday };
}

function calcHoursInPeriod(timeEntries, periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return 0;
  const start = new Date(periodStart); start.setHours(0,0,0,0);
  const end = new Date(periodEnd); end.setHours(23,59,59,999);
  return timeEntries
    .filter((e) => {
      if (!e.clockInTime || !e.clockOutTime) return false;
      const d = new Date(e.clockInTime);
      return d >= start && d <= end;
    })
    .reduce((sum, e) => {
      const diff = new Date(e.clockOutTime) - new Date(e.clockInTime);
      return sum + (diff > 0 ? diff / 3600000 : 0);
    }, 0);
}

function OverviewCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: accent || "#111827" }}>{value}</span>
      {sub && <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>{sub}</span>}
    </div>
  );
}

function EmployeesPage() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("overview");
  const [timeEntries, setTimeEntries] = useState([]);
  const [ptoRequests, setPtoRequests] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const [ptoForm, setPtoForm] = useState({
    startDate: "", endDate: "", hoursRequested: "", reason: "",
  });

  const [profileForm, setProfileForm] = useState({
    phone: "", streetAddress: "", addressLine2: "", city: "",
    state: "", zip: "", country: "United States",
    emergencyContact: "", emergencyPhone: "",
  });

  useEffect(() => {
    async function loadTimeEntries() {
      try {
        const data = await fetchTimeEntries(id);
        setTimeEntries(data);
        const openEntry = data.find((e) => !e.clockOutTime);
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
        setEmployee({ ...data, name: `${data.firstName} ${data.lastName}` });
        setProfileForm({
          phone: data.phone || "",
          streetAddress: data.streetAddress || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "United States",
          emergencyContact: data.emergencyContact || "",
          emergencyPhone: data.emergencyPhone || "",
        });
        if (data.companyId) {
          const companyData = await fetchCompanyById(data.companyId);
          setCompany(companyData);
        }
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
      setTimeEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
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
    setError(""); setMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError("New passwords do not match."); return; }
    try {
      await changeEmployeePassword(id, passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
    setError(""); setMessage("");
    if (!ptoForm.startDate || !ptoForm.endDate) { setError("Start date and end date are required."); return; }
    if (!ptoForm.hoursRequested || Number(ptoForm.hoursRequested) <= 0) { setError("PTO hours must be greater than 0."); return; }
    if (new Date(ptoForm.endDate) < new Date(ptoForm.startDate)) { setError("End date cannot be before start date."); return; }
    try {
      const created = await createPtoRequest(id, ptoForm);
      setPtoRequests((prev) => [created, ...prev]);
      setPtoForm({ startDate: "", endDate: "", hoursRequested: "", reason: "" });
      setMessage("PTO request submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit PTO request");
    }
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      const updated = await updateEmployeeProfile(id, profileForm);
      setEmployee((prev) => ({ ...prev, ...updated }));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
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


  function buildDisplayEntries() {
    const ptoEntries = ptoRequests
      .filter((r) => r.status === "APPROVED")
      .flatMap((r) => {
        const start = new Date(`${r.startDate}T00:00:00`);
        const end = new Date(`${r.endDate}T00:00:00`);
        const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
        const hoursPerDay = Number(r.hoursRequested) / totalDays;
        const days = [];
        const current = new Date(start);
        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          const endHour = Math.min(Math.floor(hoursPerDay), 23);
          const endMin = Math.round((hoursPerDay % 1) * 60);
          days.push({
            id: `pto-${r.id}-${dateStr}`,
            clockInTime: `${dateStr}T00:00:00`,
            clockOutTime: `${dateStr}T${String(endHour).padStart(2,"0")}:${String(endMin).padStart(2,"0")}:00`,
            workDate: dateStr,
            isPto: true,
          });
          current.setDate(current.getDate() + 1);
        }
        return days;
      });

    return [...timeEntries, ...ptoEntries];
  }

  if (!employee) return <p>Loading employee info...</p>;

  const payrollInfo = getPayrollInfo(company);
  const hoursThisPeriod = payrollInfo
    ? calcHoursInPeriod(timeEntries, payrollInfo.periodStart, payrollInfo.periodEnd)
    : 0;
  const pendingPto = ptoRequests.filter((r) => r.status === "PENDING");

  return (
    <div className="company-page">
      <div className="company-left">
        <h1>Welcome, {employee.name}</h1>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Company:</strong> {employee.companyName || "N/A"}</p>
        <p>
          <strong>Compensation:</strong>{" "}
          {employee.payType === "SALARY"
            ? `$${Number(employee.salaryRate || 0).toLocaleString()}/yr (Salary)`
            : `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr (Hourly)`}
        </p>

        <div className="employee-tabs">
          <button type="button" className={`employee-tab${activeTab === "overview" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("overview")}>Overview</button>
          <button type="button" className={`employee-tab${activeTab === "timeclock" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("timeclock")}>Time Clock</button>
          <button type="button" className={`employee-tab${activeTab === "pto" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("pto")}>Request PTO</button>
          <button type="button" className={`employee-tab${activeTab === "profile" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("profile")}>Edit Profile</button>
          <button type="button" className={`employee-tab${activeTab === "password" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("password")}>Change Password</button>
          <button type="button" className={`employee-tab${activeTab === "documents" ? " employee-tab--active" : ""}`} onClick={() => handleTabChange("documents")}>
            Documents
          </button>
        </div>
      </div>

      <div className="company-right">


        {activeTab === "overview" && (
          <div className="employee-tab-content">
            <h2 style={{ marginBottom: 20 }}>Overview</h2>

            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: isClockedIn ? "#d1fae5" : "#f3f4f6",
              border: `1px solid ${isClockedIn ? "#6ee7b7" : "#e5e7eb"}`,
              borderRadius: 10, padding: "12px 20px", marginBottom: 20,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: isClockedIn ? "#10b981" : "#9ca3af", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: isClockedIn ? "#065f46" : "#374151" }}>
                {isClockedIn ? "Currently Clocked In" : "Currently Clocked Out"}
              </span>
              <div style={{ marginLeft: "auto" }}>
                {!isClockedIn
                  ? <button type="button" onClick={handleClockIn} style={{ padding: "6px 16px", background: "#3d52c4", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Clock In</button>
                  : <button type="button" onClick={handleClockOut} style={{ padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Clock Out</button>
                }
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              <OverviewCard label="PTO Balance" value={`${Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs`} sub="Available to use" />
              <OverviewCard
                label="Hours This Period"
                value={`${hoursThisPeriod.toFixed(2)} hrs`}
                sub={hoursThisPeriod > 40 ? `${(hoursThisPeriod - 40).toFixed(2)} hrs OT` : "No overtime"}
                accent={hoursThisPeriod > 40 ? "#ef4444" : undefined}
              />
              <OverviewCard
                label="Pending PTO Requests"
                value={pendingPto.length}
                sub={pendingPto.length > 0 ? `${pendingPto.length} awaiting approval` : "None pending"}
                accent={pendingPto.length > 0 ? "#f59e0b" : undefined}
              />
              {payrollInfo && (
                <OverviewCard
                  label="Next Payday"
                  value={toDateStr(payrollInfo.nextPayday)}
                  sub={`${payrollInfo.payrollType === "BIWEEKLY" ? "Bi-weekly" : "Weekly"} · ${payrollInfo.payday.charAt(0) + payrollInfo.payday.slice(1).toLowerCase()}`}
                />
              )}
            </div>

            {payrollInfo && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Current Pay Period</p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                  {toDateStr(payrollInfo.periodStart)} — {toDateStr(payrollInfo.periodEnd)}
                </p>
              </div>
            )}

            {pendingPto.length > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#92400e" }}>Pending PTO Requests</p>
                {pendingPto.map((r) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #fde68a" }}>
                    <span style={{ fontSize: "0.9rem", color: "#374151" }}>{r.startDate} — {r.endDate}</span>
                    <span style={{ fontSize: "0.85rem", color: "#92400e", fontWeight: 500 }}>{Number(r.hoursRequested || 0).toFixed(0)} hrs</span>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="error-message" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}


        {activeTab === "timeclock" && (
          <div className="employee-tab-content">
            <div className="clock-actions">
              {!isClockedIn
                ? <button type="button" onClick={handleClockIn}>Clock In</button>
                : <button type="button" onClick={handleClockOut}>Clock Out</button>}
            </div>
            {error && <p className="error-message">{error}</p>}
            <h3>Recent Time Entries</h3>

            <TimeSheetGrid timeEntries={buildDisplayEntries()} />
          </div>
        )}


        {activeTab === "pto" && (
          <div className="employee-tab-content">
            <h2>Request PTO</h2>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <form onSubmit={handleSubmitPtoRequest} className="register-form">
              <p><strong>Available PTO:</strong> {Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs</p>
              <label>Start Date<input type="date" name="startDate" value={ptoForm.startDate} onChange={handlePtoInputChange} required /></label>
              <label>End Date<input type="date" name="endDate" value={ptoForm.endDate} onChange={handlePtoInputChange} required /></label>
              <label>PTO Hours Requested<input type="number" name="hoursRequested" value={ptoForm.hoursRequested} onChange={handlePtoInputChange} min="1" step="1" required /></label>
              <label>Reason<textarea name="reason" value={ptoForm.reason} onChange={handlePtoInputChange} rows="4" placeholder="Optional reason..." /></label>
              <button type="submit">Submit PTO Request</button>
            </form>
            <hr />
            <h3>My PTO Requests</h3>
            {ptoRequests.length === 0 ? <p>No PTO requests yet.</p> : (
              <div className="pto-request-list">
                {ptoRequests.map((request) => (
                  <div key={request.id} className="pto-request-card">
                    <div className="pto-request-card-header">
                      <strong>{request.startDate} — {request.endDate}</strong>
                      <span className={getStatusClass(request.status)}>{request.status}</span>
                    </div>
                    <p><strong>Hours Requested:</strong> {Number(request.hoursRequested || 0).toFixed(2)} hrs</p>
                    <p><strong>Reason:</strong> {request.reason || "No reason provided"}</p>
                    {request.reviewNote && <p><strong>Manager Note:</strong> {request.reviewNote}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === "profile" && (
          <div className="employee-tab-content">
            <h2>Edit Profile</h2>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <form onSubmit={handleUpdateProfile} className="register-form">
              <label>Phone Number<input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} placeholder="(555) 555-5555" /></label>
              <hr />
              <h4 style={{ margin: "8px 0 4px" }}>Address</h4>
              <label>Street Address<input type="text" name="streetAddress" value={profileForm.streetAddress} onChange={handleProfileChange} placeholder="123 Main St" /></label>
              <label>Address Line 2<input type="text" name="addressLine2" value={profileForm.addressLine2} onChange={handleProfileChange} placeholder="Apt, Suite, Unit (optional)" /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>City<input type="text" name="city" value={profileForm.city} onChange={handleProfileChange} placeholder="City" /></label>
                <label>
                  State / Province / Region
                  <select name="state" value={profileForm.state} onChange={handleProfileChange}>
                    <option value="">Select state</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>ZIP / Postal Code<input type="text" name="zip" value={profileForm.zip} onChange={handleProfileChange} placeholder="12345" /></label>
                <label>Country<input type="text" name="country" value={profileForm.country} onChange={handleProfileChange} placeholder="United States" /></label>
              </div>
              <hr />
              <h4 style={{ margin: "8px 0 4px" }}>Emergency Contact</h4>
              <label>Emergency Contact Name<input type="text" name="emergencyContact" value={profileForm.emergencyContact} onChange={handleProfileChange} placeholder="Full name" /></label>
              <label>Emergency Contact Phone<input type="tel" name="emergencyPhone" value={profileForm.emergencyPhone} onChange={handleProfileChange} placeholder="(555) 555-5555" /></label>
              <button type="submit">Save Profile</button>
            </form>
          </div>
        )}


        {activeTab === "password" && (
          <div className="employee-tab-content">
            <h2>Change Password</h2>
            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
            <form onSubmit={handleChangePassword} className="register-form">
              <label>Current Password<input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordInputChange} required /></label>
              <label>New Password<input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordInputChange} required /></label>
              <label>Confirm New Password<input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordInputChange} required /></label>
              <button type="submit">Update Password</button>
            </form>
          </div>
        )}
    {activeTab === "documents" && (
      <DocumentsPanel companyId={employee.companyId} canUpload={false} />
    )}
      </div>
    </div>
  );
}

export default EmployeesPage;