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
import DocumentsPanel from "../components/DocumentsPanel";

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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMostRecentWeekday(targetDayName) {
  const dayMap = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const targetDay = dayMap[targetDayName || "FRIDAY"];
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diff = (today.getDay() - targetDay + 7) % 7;

  return addDays(today, -diff);
}

function getNextWeekday(targetDayName) {
  const dayMap = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const targetDay = dayMap[targetDayName || "FRIDAY"];
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diff = (targetDay - today.getDay() + 7) % 7 || 7;

  return addDays(today, diff);
}

function getPayrollInfo(company) {
  if (!company) return null;

  const payrollType = company.payrollType || "WEEKLY";
  const payday = company.payday || "FRIDAY";

  let periodStart;
  let periodEnd;
  let nextPayday;

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

  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  return timeEntries
    .filter((entry) => {
      if (!entry.clockInTime || !entry.clockOutTime) return false;

      const entryDate = new Date(entry.clockInTime);

      return entryDate >= start && entryDate <= end;
    })
    .reduce((sum, entry) => {
      const diff = new Date(entry.clockOutTime) - new Date(entry.clockInTime);
      return sum + (diff > 0 ? diff / 3600000 : 0);
    }, 0);
}

function OverviewCard({ label, value, sub, accent }) {
  return (
    <div className="employee-overview-card">
      <span>{label}</span>
      <strong style={{ color: accent || undefined }}>{value}</strong>
      {sub && <p>{sub}</p>}
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
  const [showPay, setShowPay] = useState(false);

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

  const [profileForm, setProfileForm] = useState({
    phone: "",
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    emergencyContact: "",
    emergencyPhone: "",
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

    setError("");
    setMessage("");

    if (!ptoForm.startDate || !ptoForm.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    if (!ptoForm.hoursRequested || Number(ptoForm.hoursRequested) <= 0) {
      setError("PTO hours must be greater than 0.");
      return;
    }

    if (new Date(ptoForm.endDate) < new Date(ptoForm.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

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

    setError("");
    setMessage("");

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
      .filter((request) => request.status === "APPROVED")
      .flatMap((request) => {
        const start = new Date(`${request.startDate}T00:00:00`);
        const end = new Date(`${request.endDate}T00:00:00`);
        const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
        const hoursPerDay = Number(request.hoursRequested) / totalDays;
        const days = [];
        const current = new Date(start);

        while (current <= end) {
          const dateStr = current.toISOString().split("T")[0];
          const endHour = Math.min(Math.floor(hoursPerDay), 23);
          const endMin = Math.round((hoursPerDay % 1) * 60);

          days.push({
            id: `pto-${request.id}-${dateStr}`,
            clockInTime: `${dateStr}T00:00:00`,
            clockOutTime: `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`,
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
  const pendingPto = ptoRequests.filter((request) => request.status === "PENDING");

  return (
    <div className="company-page employee-portal-page">
      <div className="company-left employee-portal-left">
        <h1>Welcome, {employee.name}</h1>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Company:</strong> {employee.companyName || "N/A"}</p>

        <label className="show-pay-toggle">
          <input
            type="checkbox"
            checked={showPay}
            onChange={() => setShowPay(!showPay)}
          />
          Show Compensation
        </label>

        {showPay && (
          <p>
            <strong>Compensation:</strong>{" "}
            {employee.payType === "SALARY"
              ? `$${Number(employee.salaryRate || 0).toLocaleString()}/yr (Salary)`
              : `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr (Hourly)`}
          </p>
        )}

        <div className="employee-tabs">
          <button
            type="button"
            className={`employee-tab${activeTab === "overview" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            className={`employee-tab${activeTab === "timeclock" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("timeclock")}
          >
            Time Clock
          </button>

          <button
            type="button"
            className={`employee-tab${activeTab === "pto" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("pto")}
          >
            Request PTO
          </button>

          <button
            type="button"
            className={`employee-tab${activeTab === "profile" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            Edit Profile
          </button>

          <button
            type="button"
            className={`employee-tab${activeTab === "password" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("password")}
          >
            Change Password
          </button>

          <button
            type="button"
            className={`employee-tab${activeTab === "documents" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("documents")}
          >
            Documents
          </button>
        </div>
      </div>

      <div className="company-right employee-portal-right">
        {activeTab === "overview" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Overview</h1>
                <p>Quick view of your time, PTO, and upcoming payroll information.</p>
              </div>
              <div className="hero-art">📊</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className={isClockedIn ? "modern-icon green" : "modern-icon blue"}>
                  {isClockedIn ? "✅" : "⏱️"}
                </div>

                <div>
                  <h2>{isClockedIn ? "Currently Clocked In" : "Currently Clocked Out"}</h2>
                  <p>
                    {isClockedIn
                      ? "You are currently tracking work time."
                      : "Clock in when you are ready to start working."}
                  </p>
                </div>
              </div>

              <div className={isClockedIn ? "clock-status-banner active" : "clock-status-banner"}>
                <div>
                  <span className="clock-status-dot" />
                  <strong>{isClockedIn ? "Active shift in progress" : "No active shift"}</strong>
                </div>

                {!isClockedIn ? (
                  <button type="button" className="clock-in-btn" onClick={handleClockIn}>
                    Clock In
                  </button>
                ) : (
                  <button type="button" className="clock-out-btn" onClick={handleClockOut}>
                    Clock Out
                  </button>
                )}
              </div>

              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="overview-card-grid">
              <OverviewCard
                label="PTO Balance"
                value={`${Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs`}
                sub="Available to use"
              />

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
              <div className="modern-card compact-card">
                <div className="modern-card-header">
                  <div className="modern-icon green">💵</div>

                  <div>
                    <h2>Current Pay Period</h2>
                    <p>{toDateStr(payrollInfo.periodStart)} — {toDateStr(payrollInfo.periodEnd)}</p>
                  </div>
                </div>
              </div>
            )}

            {pendingPto.length > 0 && (
              <div className="modern-card">
                <div className="modern-card-header">
                  <div className="modern-icon yellow">🌴</div>

                  <div>
                    <h2>Pending PTO Requests</h2>
                    <p>These requests are waiting for manager review.</p>
                  </div>
                </div>

                <div className="employee-pending-pto-list">
                  {pendingPto.map((request) => (
                    <div key={request.id} className="employee-pending-pto-item">
                      <span>{request.startDate} — {request.endDate}</span>
                      <strong>{Number(request.hoursRequested || 0).toFixed(0)} hrs</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeclock" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Time Clock</h1>
                <p>Clock in or out and review your recent time entries.</p>
              </div>
              <div className="hero-art">⏱️</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className={isClockedIn ? "modern-icon green" : "modern-icon blue"}>
                  ⏱️
                </div>

                <div>
                  <h2>{isClockedIn ? "Shift Active" : "Ready to Clock In"}</h2>
                  <p>
                    {isClockedIn
                      ? "Clock out when your shift or work session is complete."
                      : "Start tracking your time for this work session."}
                  </p>
                </div>
              </div>

              <div className={isClockedIn ? "clock-status-banner active" : "clock-status-banner"}>
                <div>
                  <span className="clock-status-dot" />
                  <strong>{isClockedIn ? "You are clocked in" : "You are clocked out"}</strong>
                </div>

                {!isClockedIn ? (
                  <button type="button" className="clock-in-btn" onClick={handleClockIn}>
                    Clock In
                  </button>
                ) : (
                  <button type="button" className="clock-out-btn" onClick={handleClockOut}>
                    Clock Out
                  </button>
                )}
              </div>

              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">📅</div>

                <div>
                  <h2>Recent Time Entries</h2>
                  <p>Your worked time and approved PTO are shown on the timesheet.</p>
                </div>
              </div>

              <div className="employee-timesheet-wrap">
                <TimeSheetGrid timeEntries={buildDisplayEntries()} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "pto" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Request PTO</h1>
                <p>Submit time off requests and track approval status.</p>
              </div>
              <div className="hero-art">🌴</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon green">🌴</div>

                <div>
                  <h2>Request Time Off</h2>
                  <p>Choose your dates, hours, and optional reason for your manager.</p>
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              <div className="employee-stat-banner">
                <span>PTO Available</span>
                <strong>{Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs</strong>
              </div>

              <form onSubmit={handleSubmitPtoRequest} className="modern-dashboard-form">
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

                <label className="full-width-field">
                  Reason
                  <textarea
                    name="reason"
                    value={ptoForm.reason}
                    onChange={handlePtoInputChange}
                    rows="4"
                    placeholder="Optional reason..."
                  />
                </label>

                <div className="modern-form-note">
                  <span>ℹ️</span>
                  PTO requests will show as pending until a manager approves or denies them.
                </div>

                <div className="form-actions">
                  <button type="submit" className="modern-save-btn">
                     Submit PTO Request
                  </button>
                </div>
              </form>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">📋</div>

                <div>
                  <h2>My PTO Requests</h2>
                  <p>Review request dates, status, and manager notes.</p>
                </div>
              </div>

              {ptoRequests.length === 0 ? (
                <div className="empty-state-card workspace-empty">
                  <h3>No PTO requests yet</h3>
                  <p>Your submitted PTO requests will appear here.</p>
                </div>
              ) : (
                <div className="pto-request-list pto-request-list-scroll employee-pto-list">
                  {ptoRequests.map((request) => (
                    <div key={request.id} className="pto-request-card">
                      <div className="pto-request-card-header">
                        <strong>{request.startDate} — {request.endDate}</strong>
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
          </div>
        )}

        {activeTab === "profile" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>My Profile</h1>
                <p>Manage your contact information and emergency contact details.</p>
              </div>
              <div className="hero-art">👤</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">👤</div>

                <div>
                  <h2>Employee Profile</h2>
                  <p>Keep your personal information up to date.</p>
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              <form onSubmit={handleUpdateProfile} className="modern-dashboard-form">
                <h3 className="form-section-title">Contact Information</h3>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="(555) 555-5555"
                  />
                </label>

                <h3 className="form-section-title">Address</h3>

                <label className="full-width-field">
                  Street Address
                  <input
                    type="text"
                    name="streetAddress"
                    value={profileForm.streetAddress}
                    onChange={handleProfileChange}
                    placeholder="123 Main St"
                  />
                </label>

                <label className="full-width-field">
                  Address Line 2
                  <input
                    type="text"
                    name="addressLine2"
                    value={profileForm.addressLine2}
                    onChange={handleProfileChange}
                    placeholder="Apt, Suite, Unit (optional)"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    name="city"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    placeholder="City"
                  />
                </label>

                <label>
                  State / Province / Region
                  <select
                    name="state"
                    value={profileForm.state}
                    onChange={handleProfileChange}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>

                <label>
                  ZIP / Postal Code
                  <input
                    type="text"
                    name="zip"
                    value={profileForm.zip}
                    onChange={handleProfileChange}
                    placeholder="12345"
                  />
                </label>

                <label>
                  Country
                  <input
                    type="text"
                    name="country"
                    value={profileForm.country}
                    onChange={handleProfileChange}
                    placeholder="United States"
                  />
                </label>

                <h3 className="form-section-title">Emergency Contact</h3>

                <label>
                  Emergency Contact Name
                  <input
                    type="text"
                    name="emergencyContact"
                    value={profileForm.emergencyContact}
                    onChange={handleProfileChange}
                    placeholder="Full name"
                  />
                </label>

                <label>
                  Emergency Contact Phone
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={profileForm.emergencyPhone}
                    onChange={handleProfileChange}
                    placeholder="(555) 555-5555"
                  />
                </label>

                <div className="modern-form-note">
                  <span>ℹ️</span>
                  Your employer can use this information for records and emergency contact purposes.
                </div>

                <div className="form-actions">
                  <button type="submit" className="modern-save-btn">
                     Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "password" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Change Password</h1>
                <p>Update the password used to access your employee account.</p>
              </div>
              <div className="hero-art">🔐</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">🔐</div>

                <div>
                  <h2>Password Security</h2>
                  <p>Enter your current password, then choose a new password.</p>
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}
              {message && <p className="success-message">{message}</p>}

              <form onSubmit={handleChangePassword} className="modern-dashboard-form password-dashboard-form">
                <h3 className="form-section-title">Verify Current Password</h3>

                <label className="full-width-field">
                  Current Password
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    required
                  />
                </label>

                <h3 className="form-section-title">Create New Password</h3>

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

                <div className="modern-form-note password-note">
                  <span>ℹ️</span>
                  Use a strong password with uppercase letters, lowercase letters, numbers, and symbols.
                </div>

                <div className="password-checklist full-width-field">
                  <div>
                    <span>✓</span>
                    Use at least 8 characters
                  </div>

                  <div>
                    <span>✓</span>
                    Avoid using your name or email
                  </div>

                  <div>
                    <span>✓</span>
                    Do not reuse old passwords
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="modern-save-btn">
                     Update Password
                  </button>
                </div>
              </form>
            </div>
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
