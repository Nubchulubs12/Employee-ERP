import { useEffect, useState } from 'react';
import { Link, useParams } from "react-router-dom";
import {
  cancelStripeSubscription,
  changeCompanyPassword,
  fetchBillingDetails,
  fetchCompanyById,
  fetchStripeInvoices,
  updateCompanyInfo,
  updateCompanySettings,
} from '../api/companyApi';
import {
  fetchEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  createTimeEntry,
  fetchTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  fetchCompanyPtoRequests,
  approvePtoRequest,
  denyPtoRequest,
} from '../api/employeeApi';
import MiniTimeGrid from '../components/MiniTimeGrid';
import DocumentsPanel from '../components/DocumentsPanel';
import PayrollPanel from '../components/PayrollPanel';
import CommissionPanel from '../components/CommissionPanel';
import { fetchEmployeeCommissions } from '../api/commissionApi';

const MAX_EMPLOYEES_MESSAGE = "you have reached the max number off employees this plan is allowed, upgrade to add more employees.";
const GROWING_MAX_EMPLOYEES_MESSAGE = "You have reached the maximum limit of this plan";

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

const WEEKDAY_PAYDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const SEMI_MONTHLY_PAYDAYS = [
  { value: "FIRST_FIFTEENTH", label: "1st and 15th" },
  { value: "FIFTEENTH_THIRTIETH", label: "15th and 30th" },
];

const MONTHLY_PAYDAYS = Array.from({ length: 31 }, (_, index) => String(index + 1));

function formatDayOfMonth(day) {
  const value = Number(day);
  const suffix = value % 100 >= 11 && value % 100 <= 13
    ? "th"
    : { 1: "st", 2: "nd", 3: "rd" }[value % 10] || "th";

  return `${value}${suffix}`;
}

function formatPayrollType(type) {
  if (type === "BIWEEKLY") return "Bi-Weekly";
  if (type === "SEMI_MONTHLY") return "Semi-Monthly";
  if (type === "MONTHLY") return "Monthly";
  if (type === "QUARTERLY") return "Quarterly";
  return "Weekly";
}

function formatPayday(payrollType, payday) {
  if (payrollType === "SEMI_MONTHLY") {
    return SEMI_MONTHLY_PAYDAYS.find((option) => option.value === payday)?.label || "1st and 15th";
  }

  if (payrollType === "MONTHLY") {
    return `${formatDayOfMonth(payday || "1")} of each month`;
  }

  if (payrollType === "QUARTERLY") {
    return `${formatDayOfMonth(payday || "1")} of Mar, Jun, Sep, and Dec`;
  }

  const day = payday || "FRIDAY";
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function formatEmployeePayType(payType) {
  if (payType === "SALARY") return "Salary";
  if (payType === "CONTRACT_1099") return "1099";
  return "Hourly";
}

function formatBillingValue(value) {
  if (!value) return "Not available";
  return value
    .toString()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCurrencyFromCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function getEmployeePayRateLabel(payType) {
  if (payType === "SALARY") return "Annual Salary:";
  if (payType === "CONTRACT_1099") return "1099 Rate:";
  return "Hourly Rate:";
}

function formatEmployeePayRate(employee) {
  if (employee.payType === "SALARY") {
    return `$${Number(employee.salaryRate || 0).toLocaleString()}/yr`;
  }

  const rate = `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr`;
  if (employee.payType === "CONTRACT_1099" && employee.commissionPercentage != null) {
    return `${rate} · ${Number(employee.commissionPercentage).toFixed(2)}% commission`;
  }
  return rate;
}

function normalizeCompanySettings(settings = {}) {
  const payrollType = settings.payrollType || "WEEKLY";
  const semiMonthlyValues = SEMI_MONTHLY_PAYDAYS.map((option) => option.value);
  const payday = payrollType === "SEMI_MONTHLY"
    ? semiMonthlyValues.includes(settings.payday)
      ? settings.payday
      : "FIRST_FIFTEENTH"
    : payrollType === "MONTHLY" || payrollType === "QUARTERLY"
      ? MONTHLY_PAYDAYS.includes(settings.payday)
        ? settings.payday
        : "1"
    : WEEKDAY_PAYDAYS.includes(settings.payday)
      ? settings.payday
      : "FRIDAY";

  return {
    payrollType,
    payday,
    biweeklyStartDate: settings.biweeklyStartDate || "",
  };
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getSemiMonthlyDay(payday, index, year, monthIndex) {
  const days = payday === "FIFTEENTH_THIRTIETH" ? [15, 30] : [1, 15];
  return Math.min(days[index], getDaysInMonth(year, monthIndex));
}

function getSemiMonthlyPayDate(payday, year, monthIndex, index) {
  return new Date(year, monthIndex, getSemiMonthlyDay(payday, index, year, monthIndex));
}

function getSemiMonthlyPeriod(payday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let periodEnd = null;
  let previousPayday = null;

  for (let offset = -1; offset <= 0; offset += 1) {
    const monthCursor = new Date(today.getFullYear(), today.getMonth() + offset, 1);

    for (let index = 0; index < 2; index += 1) {
      const candidate = getSemiMonthlyPayDate(
        payday,
        monthCursor.getFullYear(),
        monthCursor.getMonth(),
        index
      );

      if (candidate <= today) {
        previousPayday = periodEnd;
        periodEnd = candidate;
      }
    }
  }

  if (!periodEnd) {
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    previousPayday = getSemiMonthlyPayDate(
      payday,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      0
    );
    periodEnd = getSemiMonthlyPayDate(
      payday,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      1
    );
  }

  if (!previousPayday) {
    const previousMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, 1);
    previousPayday = getSemiMonthlyPayDate(
      payday,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      1
    );
  }

  return {
    start: addDays(previousPayday, 1),
    end: periodEnd,
  };
}

function getMonthlyPayDate(payday, year, monthIndex) {
  const day = Math.min(Number(payday) || 1, getDaysInMonth(year, monthIndex));
  return new Date(year, monthIndex, day);
}

function getMonthlyPeriod(payday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonthPayday = getMonthlyPayDate(payday, today.getFullYear(), today.getMonth());
  const periodEnd = thisMonthPayday <= today
    ? thisMonthPayday
    : getMonthlyPayDate(payday, today.getFullYear(), today.getMonth() - 1);
  const previousPayday = getMonthlyPayDate(
    payday,
    periodEnd.getFullYear(),
    periodEnd.getMonth() - 1
  );

  return { start: addDays(previousPayday, 1), end: periodEnd };
}

function getQuarterlyPayDate(payday, year, quarterEndMonthIndex) {
  return getMonthlyPayDate(payday, year, quarterEndMonthIndex);
}

function getQuarterlyPeriod(payday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const quarterEndMonth = Math.floor(today.getMonth() / 3) * 3 + 2;
  const thisQuarterPayday = getQuarterlyPayDate(payday, today.getFullYear(), quarterEndMonth);
  const periodEnd = thisQuarterPayday <= today
    ? thisQuarterPayday
    : getQuarterlyPayDate(payday, today.getFullYear(), quarterEndMonth - 3);
  const previousPayday = getQuarterlyPayDate(
    payday,
    periodEnd.getFullYear(),
    periodEnd.getMonth() - 3
  );

  return { start: addDays(previousPayday, 1), end: periodEnd };
}

function PayTypeCheckboxes({ payType, onChange }) {
  return (
    <div>
      <label style={{ marginBottom: 4, display: "block" }}>Pay Type</label>
      <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={payType === "HOURLY"} onChange={() => onChange("HOURLY")} />
          Hourly
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={payType === "SALARY"} onChange={() => onChange("SALARY")} />
          Salary
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={payType === "CONTRACT_1099"} onChange={() => onChange("CONTRACT_1099")} />
          1099
        </label>
      </div>
    </div>
  );
}


function CompaniesPage() {
  const { id } = useParams();

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeCompanyTab, setActiveCompanyTab] = useState("employees");

  const [companyInfoForm, setCompanyInfoForm] = useState({
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });

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
    newPassword: "",
    jobTitle: "",
    hireDate: "",
    payType: "HOURLY",
    hourlyRate: "",
    salaryRate: "",
    commissionPercentage: "",
    ptoBalanceHours: "",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedEmployeePtoRequests, setSelectedEmployeePtoRequests] = useState([]);
  const [selectedEmployeeCommissions, setSelectedEmployeeCommissions] = useState([]);
  const [editingTimeEntryId, setEditingTimeEntryId] = useState(null);
  const [addingTimeEntryDate, setAddingTimeEntryDate] = useState(null);
  const [timeForm, setTimeForm] = useState({ clockInTime: "", clockOutTime: "", isCurrent: false });

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
    commissionPercentage: "",
    ptoBalanceHours: "",
  });

  const [ptoRequests, setPtoRequests] = useState([]);
  const [ptoReviewNotes, setPtoReviewNotes] = useState({});
  const [showPtoManager, setShowPtoManager] = useState(false);
  const [ptoManagerEmployeeId, setPtoManagerEmployeeId] = useState(null);

  const [companyPasswordForm, setCompanyPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [billingDetails, setBillingDetails] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      try {
        const data = await fetchCompanyById(id);
        setCompany(data);

        setEmployeeForm((prev) => ({ ...prev, companyId: data.id }));

        setCompanySettingsForm(normalizeCompanySettings(data));

        setCompanyInfoForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          streetAddress: data.streetAddress || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          country: data.country || "United States",
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
    setPtoManagerEmployeeId(null);
    setSelectedEmployeeId(null);
    setSelectedEmployeePtoRequests([]);
    setSelectedEmployeeCommissions([]);
    setEditingEmployeeId(null);
    setEditingTimeEntryId(null);
    setAddingTimeEntryDate(null);

    if (tab === "billing") {
      loadBillingDetails();
    }
  }

  async function loadBillingDetails() {
    setBillingLoading(true);
    setError("");

    try {
      const data = await fetchBillingDetails(id);
      setBillingDetails(data);
    } catch (err) {
      setError(err.message || "Failed to load billing details");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleOpenInvoices() {
    setError("");
    setInvoiceMessage("");
    setInvoiceLoading(true);

    try {
      const data = await fetchStripeInvoices(id);
      setInvoices(data || []);
      if (!data || data.length === 0) {
        setInvoiceMessage("Invoices are not available yet for this company.");
      }
    } catch (err) {
      setInvoices([]);
      setInvoiceMessage("Invoices are unavailable right now. Check Stripe setup and try again.");
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function handleCancelSubscription() {
    setError("");
    setMessage("");

    try {
      await cancelStripeSubscription(id);
      setShowCancelConfirm(false);
      setMessage("Subscription canceled. This company account can no longer log in.");
      const refreshedCompany = await fetchCompanyById(id);
      setCompany(refreshedCompany);
      await loadBillingDetails();
    } catch (err) {
      setError(err.message || "Failed to cancel subscription");
    }
  }

  function handleCompanyInfoChange(e) {
    const { name, value } = e.target;
    setCompanyInfoForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveCompanyInfo(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const updated = await updateCompanyInfo(id, companyInfoForm);
      setCompany(updated);
      setMessage("Company info updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update company info");
    }
  }

  function handleCompanySettingsChange(e) {
    const { name, value } = e.target;
    setCompanySettingsForm((prev) => {
      if (name !== "payrollType") {
        return { ...prev, [name]: value };
      }

      return {
        ...prev,
        payrollType: value,
        payday: value === "SEMI_MONTHLY"
          ? "FIRST_FIFTEENTH"
          : value === "MONTHLY" || value === "QUARTERLY"
            ? "1"
            : "FRIDAY",
      };
    });
  }

  async function handleSaveCompanySettings(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const updated = await updateCompanySettings(id, companySettingsForm);
      setCompany(updated);

      setCompanySettingsForm(normalizeCompanySettings(updated));

      setMessage("Company settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save company settings");
    }
  }

  function handleCompanyPasswordChange(e) {
    const { name, value } = e.target;
    setCompanyPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleChangeCompanyPassword(e) {
    e.preventDefault();
    setError(""); setMessage("");
    if (companyPasswordForm.newPassword !== companyPasswordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    try {
      await changeCompanyPassword(id, companyPasswordForm);
      setCompanyPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  }

  async function handleManagePto(employee) {
    try {
      setShowPtoManager(true);
      setPtoManagerEmployeeId(employee.id);
      setSelectedEmployeeId(null);
      setSelectedEmployeePtoRequests([]);
      setSelectedEmployeeCommissions([]);
      setEditingEmployeeId(null);
      setEditingTimeEntryId(null);
      setAddingTimeEntryDate(null);

      const refreshedEmployees = await fetchEmployees(id);
      setEmployees(refreshedEmployees);

      const data = await fetchCompanyPtoRequests(id);

      const employeeFullName = `${employee.firstName || ""} ${employee.lastName || ""}`
        .trim()
        .toLowerCase();

      const employeePtoRequests = data.filter((request) => {
        const requestEmployeeId =
          request.employeeId ||
          request.employee?.id ||
          request.employee?.employeeId;

        const requestEmployeeName = (request.employeeName || "")
          .trim()
          .toLowerCase();

        return (
          Number(requestEmployeeId) === Number(employee.id) ||
          requestEmployeeName === employeeFullName
        );
      });

      setPtoRequests(employeePtoRequests);
    } catch (err) {
      setError(err.message || "Failed to load PTO requests");
    }
  }

  function handleClosePtoManager() {
    setShowPtoManager(false);
    setPtoManagerEmployeeId(null);
    setPtoRequests([]);
  }

  function handleEmployeeChange(e) {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({ ...prev, [name]: value }));
  }

  function getMaxEmployeesMessage() {
    return company?.planCode === "GROWING"
      ? GROWING_MAX_EMPLOYEES_MESSAGE
      : MAX_EMPLOYEES_MESSAGE;
  }

  async function handleAddEmployee(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (company?.trialExpired) {
      window.alert("Your trial has expired. Upgrade to continue using the company portal.");
      return;
    }

    if (company?.employeeLimit && employees.length >= company.employeeLimit) {
      window.alert(getMaxEmployeesMessage());
      return;
    }

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
        commissionPercentage: "",
        ptoBalanceHours: "",
      });

      setMessage("Employee added successfully.");
    } catch (err) {
      if (
        err.message === MAX_EMPLOYEES_MESSAGE ||
        err.message === GROWING_MAX_EMPLOYEES_MESSAGE
      ) {
        window.alert(err.message);
      }
      setError(err.message || "Failed to create employee");
    }
  }

  function handleEditClick(employee) {
    setShowPtoManager(false);
    setPtoManagerEmployeeId(null);
    setSelectedEmployeeId(null);
    setSelectedEmployeePtoRequests([]);
    setSelectedEmployeeCommissions([]);
    setEditingTimeEntryId(null);
    setAddingTimeEntryDate(null);
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
      commissionPercentage: employee.commissionPercentage ?? "",
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
        newPassword: "" ,
        jobTitle: "",
        hireDate: "",
        payType: "HOURLY",
        hourlyRate: "",
        salaryRate: "",
        commissionPercentage: "",
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
        setSelectedEmployeePtoRequests([]);
        setSelectedEmployeeCommissions([]);
        setTimeEntries([]);
      }

      if (ptoManagerEmployeeId === employeeId) {
        setShowPtoManager(false);
        setPtoManagerEmployeeId(null);
        setPtoRequests([]);
      }
    } catch (err) {
      setError(err.message || "Failed to delete employee");
    }
  }

  async function handleManageTime(employee) {
    try {
      setSelectedEmployeeId(employee.id);
      setShowPtoManager(false);
      setPtoManagerEmployeeId(null);
      setPtoRequests([]);
      setEditingEmployeeId(null);
      setEditingTimeEntryId(null);
      setAddingTimeEntryDate(null);
      setSelectedEmployeePtoRequests([]);
      setSelectedEmployeeCommissions([]);

      const period = getPayrollPeriod();

      const [timeData, companyPtoData, commissionData] = await Promise.all([
        fetchTimeEntries(employee.id),
        fetchCompanyPtoRequests(id),
        fetchEmployeeCommissions(employee.id, period.startText, period.endText),
      ]);

      const employeeFullName = `${employee.firstName || ""} ${employee.lastName || ""}`
        .trim()
        .toLowerCase();

      const employeePtoRequests = companyPtoData.filter((request) => {
        const requestEmployeeId =
          request.employeeId ||
          request.employee?.id ||
          request.employee?.employeeId;

        const requestEmployeeName = (request.employeeName || "")
          .trim()
          .toLowerCase();

        return (
          Number(requestEmployeeId) === Number(employee.id) ||
          requestEmployeeName === employeeFullName
        );
      });

      setTimeEntries(timeData);
      setSelectedEmployeePtoRequests(employeePtoRequests);
      setSelectedEmployeeCommissions(commissionData);
    } catch (err) {
      setError(err.message || "Failed to load time entries");
    }
  }

  function handleCloseTimeManager() {
    setSelectedEmployeeId(null);
    setEditingTimeEntryId(null);
    setAddingTimeEntryDate(null);
    setTimeEntries([]);
    setSelectedEmployeePtoRequests([]);
    setSelectedEmployeeCommissions([]);
  }

  function handleEditTimeClick(entry) {
    if (entry.isPto) return;

    setEditingTimeEntryId(entry.id);
    setAddingTimeEntryDate(null);

    setTimeForm({
      clockInTime: entry.clockInTime ? entry.clockInTime.slice(0, 16) : "",
      clockOutTime: entry.clockOutTime ? entry.clockOutTime.slice(0, 16) : "",
      isCurrent: !entry.clockOutTime,
    });
  }

  function handleAddTimeClick(dateKey) {
    setEditingTimeEntryId(null);
    setAddingTimeEntryDate(dateKey);
    setTimeForm({
      clockInTime: `${dateKey}T09:00`,
      clockOutTime: `${dateKey}T17:00`,
      isCurrent: false,
    });
  }

  function handleTimeFormChange(e) {
    const { name, value } = e.target;
    setTimeForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCurrentTimeChange(e) {
    const isCurrent = e.target.checked;
    setTimeForm((prev) => ({
      ...prev,
      isCurrent,
      clockOutTime: isCurrent ? "" : prev.clockOutTime,
    }));
  }

  async function handleUpdateTimeEntry(e) {
    e.preventDefault();

    try {
      const updated = await updateTimeEntry(editingTimeEntryId, {
        clockInTime: timeForm.clockInTime,
        clockOutTime: timeForm.isCurrent ? null : timeForm.clockOutTime,
      });

      setTimeEntries((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      );

      setEditingTimeEntryId(null);
      setTimeForm({ clockInTime: "", clockOutTime: "", isCurrent: false });
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
    if (entry.isPto) {
      return Number(entry.ptoHours || 0);
    }

    if (!entry.clockInTime || !entry.clockOutTime) return 0;

    const clockIn = new Date(entry.clockInTime);
    const clockOut = new Date(entry.clockOutTime);

    if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime())) {
      return 0;
    }

    return (clockOut - clockIn) / (1000 * 60 * 60);
  }

  function buildPtoPayrollEntries(requests = []) {
    return requests
      .filter((request) => request.status === "APPROVED")
      .flatMap((request) => {
        const start = new Date(`${request.startDate}T00:00:00`);
        const end = new Date(`${request.endDate}T00:00:00`);

        const totalDays =
          Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const hoursPerDay = Number(request.hoursRequested || 0) / totalDays;

        const entries = [];
        const current = new Date(start);

        while (current <= end) {
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, "0");
          const day = String(current.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          entries.push({
            id: `pto-payroll-${request.id}-${dateStr}`,
            workDate: dateStr,
            clockInTime: `${dateStr}T00:00:00`,
            clockOutTime: `${dateStr}T00:00:00`,
            ptoHours: hoursPerDay,
            isPto: true,
          });

          current.setDate(current.getDate() + 1);
        }

        return entries;
      });
  }

  function calculatePayroll(entries, employee, commissions = []) {
    const totalHours = entries.reduce((sum, entry) => sum + calculateHours(entry), 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(totalHours - 40, 0);

    if (employee.payType === "SALARY") {
      const annualSalary = Number(employee.salaryRate || 0);
      const period = getPayrollPeriod();
      const days =
        (new Date(period.end) - new Date(period.start)) / (1000 * 60 * 60 * 24) + 1;
      const basePay = (annualSalary / 365) * days;
      const commissionPay = commissions.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

      return { totalHours, regularHours, overtimeHours: 0, commissionPay, grossPay: basePay + commissionPay };
    }

    const rate = Number(employee.hourlyRate || 0);
    if (employee.payType === "CONTRACT_1099") {
      const commissionPay = commissions.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      return { totalHours, regularHours: totalHours, overtimeHours: 0, commissionPay, grossPay: totalHours * rate + commissionPay };
    }

    const commissionPay = commissions.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const grossPay = regularHours * rate + overtimeHours * rate * 1.5 + commissionPay;

    return { totalHours, regularHours, overtimeHours, commissionPay, grossPay };
  }

  function toDateOnly(date) {
    return date.toISOString().split("T")[0];
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

  function getPayrollPeriod() {
    const payrollType = companySettingsForm.payrollType || "WEEKLY";

    if (payrollType === "BIWEEKLY") {
      const start = companySettingsForm.biweeklyStartDate
        ? new Date(`${companySettingsForm.biweeklyStartDate}T00:00:00`)
        : new Date();

      const end = addDays(start, 13);

      return {
        start,
        end,
        startText: toDateOnly(start),
        endText: toDateOnly(end),
      };
    }

    if (payrollType === "SEMI_MONTHLY") {
      const period = getSemiMonthlyPeriod(companySettingsForm.payday || "FIRST_FIFTEENTH");

      return {
        start: period.start,
        end: period.end,
        startText: toDateOnly(period.start),
        endText: toDateOnly(period.end),
      };
    }

    if (payrollType === "MONTHLY") {
      const period = getMonthlyPeriod(companySettingsForm.payday || "1");

      return {
        start: period.start,
        end: period.end,
        startText: toDateOnly(period.start),
        endText: toDateOnly(period.end),
      };
    }

    if (payrollType === "QUARTERLY") {
      const period = getQuarterlyPeriod(companySettingsForm.payday || "1");

      return {
        start: period.start,
        end: period.end,
        startText: toDateOnly(period.start),
        endText: toDateOnly(period.end),
      };
    }

    const paydayDate = getMostRecentWeekday(companySettingsForm.payday || "FRIDAY");
    const start = addDays(paydayDate, -6);

    return {
      start,
      end: paydayDate,
      startText: toDateOnly(start),
      endText: toDateOnly(paydayDate),
    };
  }

  function isEntryInPayrollPeriod(entry, start, end) {
    if (!entry.clockInTime) return false;

    const entryDate = new Date(entry.clockInTime);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    return entryDate >= startDate && entryDate <= endDate;
  }

  function getPayrollEntries(entries) {
    const period = getPayrollPeriod();

    const ptoPayrollEntries = buildPtoPayrollEntries(selectedEmployeePtoRequests);
    const combinedEntries = [...entries, ...ptoPayrollEntries];

    return combinedEntries.filter((entry) =>
      isEntryInPayrollPeriod(entry, period.start, period.end)
    );
  }

  function handlePtoNoteChange(requestId, value) {
    setPtoReviewNotes((prev) => ({ ...prev, [requestId]: value }));
  }

  async function handleApprovePto(requestId) {
    try {
      const updated = await approvePtoRequest(
        requestId,
        ptoReviewNotes[requestId] || ""
      );

      setPtoRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );

      const refreshedEmployees = await fetchEmployees(id);
      setEmployees(refreshedEmployees);

      setPtoReviewNotes((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err) {
      setError(err.message || "Failed to approve PTO request");
    }
  }

  async function handleDenyPto(requestId) {
    try {
      const updated = await denyPtoRequest(
        requestId,
        ptoReviewNotes[requestId] || ""
      );

      setPtoRequests((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );

      setPtoReviewNotes((prev) => ({ ...prev, [requestId]: "" }));
    } catch (err) {
      setError(err.message || "Failed to deny PTO request");
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const search = employeeSearch.toLowerCase();
    return (
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      (emp.jobTitle || "").toLowerCase().includes(search)
    );
  });

  function getStatusClass(status) {
    if (status === "APPROVED") return "pto-status pto-status-approved";
    if (status === "DENIED") return "pto-status pto-status-denied";
    return "pto-status pto-status-pending";
  }

  if (error) return <p className="error-message">{error}</p>;
  if (!company) return <p>Loading company info...</p>;

  const displayAddress = company.streetAddress
    ? [
        company.streetAddress,
        company.addressLine2,
        company.city,
        company.state,
        company.zip,
        company.country,
      ]
        .filter(Boolean)
        .join(", ")
    : company.address || "N/A";

  const employeeLimit = company.employeeLimit || 0;
  const planUsageText = employeeLimit
    ? `${employees.length} / ${employeeLimit} employees`
    : `${employees.length} employees`;

  if (company.trialExpired) {
    return (
      <div className="company-page">
        <div className="company-left">
          <div className="register-card">
            <h1>{company.name}</h1>
            <p><strong>Email:</strong> {company.email}</p>
            <p><strong>Phone:</strong> {company.phone || "N/A"}</p>
            <p><strong>Address:</strong> {displayAddress}</p>

            <div className="company-plan-card">
              <span>Current plan</span>
              <strong>{company.planName || "Trial"}</strong>
              <p>Expired on {company.trialEndsOn || "day 30"}</p>
            </div>

            <div className="company-sidebar-footer">
              <Link to={`/pricing?upgradeCompanyId=${company.id}`}>
                Upgrade plan
              </Link>
            </div>
          </div>
        </div>

        <div className="company-right">
          <div className="trial-expired-card">
            <h1>Trial expired</h1>
            <p>Your 30 day trial has ended. Upgrade your plan to continue using the company portal.</p>
            <Link to={`/pricing?upgradeCompanyId=${company.id}`} className="modern-save-btn">
              View Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleCreateTimeEntry(e) {
    e.preventDefault();

    try {
      const created = await createTimeEntry(selectedEmployeeId, {
        clockInTime: timeForm.clockInTime,
        clockOutTime: timeForm.clockOutTime || null,
      });

      setTimeEntries((prev) => [created, ...prev]);
      setAddingTimeEntryDate(null);
      setTimeForm({ clockInTime: "", clockOutTime: "", isCurrent: false });
      setMessage("Time entry added successfully.");
    } catch (err) {
      setError(err.message || "Failed to create time entry");
    }
  }

  return (
    <div className="company-page">
      <div className="company-left">
        <div className="register-card">
          <h1>{company.name}</h1>
          <p><strong>Email:</strong> {company.email}</p>
          <p><strong>Phone:</strong> {company.phone || "N/A"}</p>
          <p><strong>Address:</strong> {displayAddress}</p>

          <div className="company-plan-card">
            <span>Current plan</span>
            <strong>{company.planName || "Trial"}</strong>
            <p>{planUsageText}</p>
          </div>

          <hr />

          <div className="employee-tabs">
            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "employees" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("employees")}
            >
              Employees
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "management" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("management")}
            >
              Employee Management
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "payroll" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("payroll")}
            >
              Payroll
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "commissions" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("commissions")}
            >
              Commissions
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "companyInfo" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("companyInfo")}
            >
              Company Info
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "settings" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("settings")}
            >
              Company Settings
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "password" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("password")}
            >
              Change Password
            </button>

            <button
              type="button"
              className={`employee-tab${activeCompanyTab === "billing" ? " employee-tab--active" : ""}`}
              onClick={() => handleCompanyTabChange("billing")}
            >
              Billing
            </button>

            <button type="button" className={`employee-tab${activeCompanyTab === "documents" ? " employee-tab--active" : ""}`} onClick={() => handleCompanyTabChange("documents")}>
              Documents
            </button>
          </div>

          <div className="company-sidebar-footer">
            <Link to={`/pricing?upgradeCompanyId=${company.id}`}>
              Upgrade plan
            </Link>
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      <div className="company-right">
        {activeCompanyTab === "employees" && (
          <div className="employee-dashboard employee-dashboard-v2">
            <div className="employee-page-header">
              <div>
                <h1>Employees</h1>
                <p>View, search, and manage employees in your company.</p>
              </div>

              <div className="employee-count-pill">
                {employees.length} Employees
              </div>
            </div>

            <div className="employee-search-card">
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
            </div>

            {employees.length === 0 ? (
              <div className="empty-state-card">
                <h3>No employees added yet</h3>
                <p>Add your first employee from the Employee Management tab.</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="empty-state-card">
                <h3>No employees found</h3>
                <p>Try searching a different name, email, or job title.</p>
              </div>
            ) : (
              <>
                <div className="employee-card-grid employee-card-grid-v2">
                  {filteredEmployees.map((employee) => {
                    const isActive =
                      editingEmployeeId === employee.id ||
                      selectedEmployeeId === employee.id ||
                      ptoManagerEmployeeId === employee.id;

                    return (
                      <div
                        key={employee.id}
                        className={`modern-employee-card employee-card-v2${isActive ? " employee-card-v2--active" : ""}`}
                      >
                        <div className="employee-card-top">
                          <div className="employee-avatar">
                            {(employee.firstName?.[0] || "")}
                            {(employee.lastName?.[0] || "")}
                          </div>

                          <div className="employee-title-block">
                            <h3>{employee.firstName} {employee.lastName}</h3>
                            <p>{employee.jobTitle || "No title set"}</p>
                          </div>

                          <details className="dropdown employee-card-menu">
                            <summary className="dropdown-summary">⋮</summary>
                            <div className="dropdown-content">
                              <button type="button" onClick={() => handleManageTime(employee)}>
                                🕐 Manage Time
                              </button>

                              <button type="button" onClick={() => handleManagePto(employee)}>
                                📋 Manage PTO
                              </button>

                              <button type="button" onClick={() => handleEditClick(employee)}>
                                ✏️ Edit
                              </button>

                              <div className="dropdown-divider" />

                              <button
                                type="button"
                                className="btn-danger"
                                onClick={() => handleDeleteEmployee(employee.id)}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </details>
                        </div>

                        <div className="employee-detail-list">
                          <div>
                            <span>Email</span>
                            <strong>{employee.email}</strong>
                          </div>

                          <div>
                            <span>Pay</span>
                            <strong>{formatEmployeePayRate(employee)}</strong>
                          </div>

                          <div>
                            <span>Pay Type</span>
                            <strong>{formatEmployeePayType(employee.payType)}</strong>
                          </div>

                          <div>
                            <span>PTO Balance</span>
                            <strong>{Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs</strong>
                          </div>
                        </div>

                        <div className="employee-card-actions">
                          <button type="button" onClick={() => handleManageTime(employee)}>
                            Manage Time
                          </button>

                          <button type="button" onClick={() => handleManagePto(employee)}>
                            Manage PTO
                          </button>

                          <button type="button" onClick={() => handleEditClick(employee)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(editingEmployeeId || selectedEmployeeId || ptoManagerEmployeeId) && (
                  <div className="employee-management-workspace">
                    {editingEmployeeId && (() => {
                      const employee = employees.find((e) => e.id === editingEmployeeId);

                      if (!employee) return null;

                      return (
                        <div className="workspace-panel">
                          <div className="workspace-panel-header">
                            <div>
                              <h2>Edit Employee</h2>
                              <p>{employee.firstName} {employee.lastName}</p>
                            </div>

                            <button
                              type="button"
                              className="workspace-close-btn"
                              onClick={() => setEditingEmployeeId(null)}
                            >
                              ✕ Close
                            </button>
                          </div>

                          <form onSubmit={handleUpdateEmployee} className="register-form workspace-form">
                            <label>
                              First Name
                              <input
                                type="text"
                                name="firstName"
                                value={editForm.firstName}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              Last Name
                              <input
                                type="text"
                                name="lastName"
                                value={editForm.lastName}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              Email
                              <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              New Password
                              <input
                                type="password"
                                name="newPassword"
                                value={editForm.newPassword}
                                onChange={handleEditChange}
                                placeholder="Leave blank to keep current password"
                              />
                            </label>

                            <label>
                              Job Title
                              <input
                                type="text"
                                name="jobTitle"
                                value={editForm.jobTitle}
                                onChange={handleEditChange}
                              />
                            </label>

                            <label>
                              Hire Date
                              <input
                                type="date"
                                name="hireDate"
                                value={editForm.hireDate}
                                onChange={handleEditChange}
                              />
                            </label>

                            <div className="workspace-form-full">
                              <PayTypeCheckboxes
                                payType={editForm.payType}
                                onChange={(type) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    payType: type,
                                    hourlyRate: "",
                                    salaryRate: "",
                                    commissionPercentage: "",
                                  }))
                                }
                              />
                            </div>

                            {(editForm.payType === "HOURLY" || editForm.payType === "CONTRACT_1099") && (
                              <label>
                                {editForm.payType === "CONTRACT_1099" ? "1099 Rate ($/hr)" : "Hourly Rate ($/hr)"}
                                <input
                                  type="number"
                                  name="hourlyRate"
                                  value={editForm.hourlyRate}
                                  onChange={handleEditChange}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </label>
                            )}

                            {editForm.payType === "CONTRACT_1099" && (
                              <label>
                                Commission Percentage (%)
                                <input
                                  type="number"
                                  name="commissionPercentage"
                                  value={editForm.commissionPercentage}
                                  onChange={handleEditChange}
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </label>
                            )}

                            {editForm.payType === "SALARY" && (
                              <label>
                                Annual Salary ($)
                                <input
                                  type="number"
                                  name="salaryRate"
                                  value={editForm.salaryRate}
                                  onChange={handleEditChange}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </label>
                            )}

                            <label>
                              PTO Balance Hours
                              <input
                                type="number"
                                name="ptoBalanceHours"
                                value={editForm.ptoBalanceHours}
                                onChange={handleEditChange}
                                min="0"
                                step="1"
                              />
                            </label>

                            <div className="edit-buttons workspace-form-actions">
                              <button type="submit">Save Changes</button>
                            </div>
                          </form>
                        </div>
                      );
                    })()}

                    {showPtoManager && ptoManagerEmployeeId && (() => {
                      const employee = employees.find((e) => e.id === ptoManagerEmployeeId);

                      if (!employee) return null;

                      return (
                        <div className="workspace-panel">
                          <div className="workspace-panel-header">
                            <div>
                              <h2>PTO Requests</h2>
                              <p>{employee.firstName} {employee.lastName}</p>
                            </div>

                            <button
                              type="button"
                              className="workspace-close-btn"
                              onClick={handleClosePtoManager}
                            >
                              ✕ Close
                            </button>
                          </div>

                          {ptoRequests.length === 0 ? (
                            <div className="empty-state-card workspace-empty">
                              <h3>No PTO requests yet</h3>
                              <p>This employee does not have any PTO requests.</p>
                            </div>
                          ) : (
                            <div className="pto-request-list-scroll workspace-pto-list">
                              {ptoRequests.map((request) => (
                                <div key={request.id} className="pto-request-card">
                                  <div className="pto-request-card-header">
                                    <strong>{request.employeeName}</strong>
                                    <span className={getStatusClass(request.status)}>
                                      {request.status}
                                    </span>
                                  </div>

                                  <p>
                                    <strong>Dates:</strong> {request.startDate} — {request.endDate}
                                  </p>

                                  <p>
                                    <strong>Hours Requested:</strong>{" "}
                                    {Number(request.hoursRequested || 0).toFixed(2)} hrs
                                  </p>

                                  <p>
                                    <strong>Available PTO:</strong>{" "}
                                    {Number(request.ptoBalanceHours || 0).toFixed(2)} hrs
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

                                  {request.status === "PENDING" && (
                                    <>
                                      <label>
                                        Review Note
                                        <textarea
                                          value={ptoReviewNotes[request.id] || ""}
                                          onChange={(e) =>
                                            handlePtoNoteChange(request.id, e.target.value)
                                          }
                                          rows="2"
                                          placeholder="Optional note..."
                                        />
                                      </label>

                                      <div className="edit-buttons">
                                        <button
                                          type="button"
                                          onClick={() => handleApprovePto(request.id)}
                                        >
                                          Approve
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDenyPto(request.id)}
                                        >
                                          Deny
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {selectedEmployeeId && (() => {
                      const employee = employees.find((e) => e.id === selectedEmployeeId);

                      if (!employee) return null;

                      return (
                        <div className="workspace-panel">
                          <div className="workspace-panel-header">
                            <div>
                              <h2>Time Entries</h2>
                              <p>{employee.firstName} {employee.lastName}</p>
                            </div>

                            <button
                              type="button"
                              className="workspace-close-btn"
                              onClick={handleCloseTimeManager}
                            >
                              ✕ Close
                            </button>
                          </div>

                          {editingTimeEntryId && (
                            <form onSubmit={handleUpdateTimeEntry} className="register-form time-edit-form workspace-time-edit">
                              <h4>Edit Entry</h4>

                              <label>
                                Clock In
                                <input
                                  type="datetime-local"
                                  name="clockInTime"
                                  value={timeForm.clockInTime}
                                  onChange={handleTimeFormChange}
                                  required
                                />
                              </label>

                              <div className="time-clock-out-field">
                                <label>
                                  Clock Out
                                  <input
                                    type="datetime-local"
                                    name="clockOutTime"
                                    value={timeForm.clockOutTime}
                                    onChange={handleTimeFormChange}
                                    disabled={timeForm.isCurrent}
                                    required={!timeForm.isCurrent}
                                  />
                                </label>

                                <label className="time-current-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={timeForm.isCurrent}
                                    onChange={handleCurrentTimeChange}
                                  />
                                  Current
                                </label>
                              </div>

                              <div className="edit-buttons">
                                <button type="submit">Save Time</button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTimeEntryId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          {addingTimeEntryDate && (
                            <form onSubmit={handleCreateTimeEntry} className="register-form time-edit-form workspace-time-edit">
                              <h4>Add Entry</h4>

                              <label>
                                Clock In
                                <input
                                  type="datetime-local"
                                  name="clockInTime"
                                  value={timeForm.clockInTime}
                                  onChange={handleTimeFormChange}
                                  required
                                />
                              </label>

                              <label>
                                Clock Out
                                <input
                                  type="datetime-local"
                                  name="clockOutTime"
                                  value={timeForm.clockOutTime}
                                  onChange={handleTimeFormChange}
                                />
                              </label>

                              <div className="edit-buttons">
                                <button type="submit">Add Time</button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingTimeEntryDate(null);
                                    setTimeForm({ clockInTime: "", clockOutTime: "", isCurrent: false });
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}

                          <>
                              <div className="workspace-time-grid">
                                <MiniTimeGrid
                                  timeEntries={timeEntries}
                                  ptoRequests={selectedEmployeePtoRequests}
                                  onEdit={handleEditTimeClick}
                                  onDelete={handleDeleteTimeEntry}
                                  onAdd={handleAddTimeClick}
                                />
                              </div>

                              {(() => {
                                const period = getPayrollPeriod();
                                const payrollEntries = getPayrollEntries(timeEntries);
                                const payroll = calculatePayroll(payrollEntries, employee, selectedEmployeeCommissions);

                                return (
                                  <div className="payroll-summary workspace-payroll-summary">
                                    <div className="payroll-summary-header">
                                      <h4>Payroll Summary</h4>

                                      <p>
                                        <strong>Payroll Type:</strong>{" "}
                                        {formatPayrollType(companySettingsForm.payrollType)}
                                      </p>
                                    </div>

                                    <div className="workspace-payroll-grid">
                                      <p><strong>Pay Period:</strong> {period.startText} — {period.endText}</p>
                                      <p>
                                        <strong>Payday:</strong>{" "}
                                        {formatPayday(companySettingsForm.payrollType, companySettingsForm.payday)}
                                      </p>
                                      <p><strong>Total Hours:</strong> {payroll.totalHours.toFixed(2)}</p>
                                      <p><strong>Regular Hours:</strong> {payroll.regularHours.toFixed(2)}</p>
                                      <p><strong>Commission:</strong> ${payroll.commissionPay.toFixed(2)}</p>

                                      {employee.payType === "HOURLY" && (
                                        <p><strong>Overtime Hours:</strong> {payroll.overtimeHours.toFixed(2)}</p>
                                      )}

                                      <p>
                                        <strong>{getEmployeePayRateLabel(employee.payType)}</strong>{" "}
                                        {formatEmployeePayRate(employee)}
                                      </p>

                                      <p className="gross-pay-highlight">
                                        <strong>Estimated Gross Pay:</strong> ${payroll.grossPay.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                          </>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeCompanyTab === "management" && (
          <div className="modern-form-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Employee Management</h1>
                <p>Add new employees and set their pay, role, and starting PTO balance.</p>
              </div>
              <div className="hero-art">👥</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">➕</div>
                <div>
                  <h2>Add Employee</h2>
                  <p>Create an employee login and payroll profile.</p>
                </div>
              </div>

              <form
                onSubmit={handleAddEmployee}
                className="modern-dashboard-form"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              >
                <h3 className="form-section-title">Employee Information</h3>

                <label>
                  First Name
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={employeeForm.firstName}
                    onChange={handleEmployeeChange}
                    required
                  />
                </label>

                <label>
                  Last Name
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={employeeForm.lastName}
                    onChange={handleEmployeeChange}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={employeeForm.email}
                    onChange={handleEmployeeChange}
                    required
                  />
                </label>

                <label>
                  Temporary Password
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={employeeForm.password}
                    onChange={handleEmployeeChange}
                    required
                  />
                </label>

                <label>
                  Job Title
                  <input
                    type="text"
                    name="jobTitle"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={employeeForm.jobTitle}
                    onChange={handleEmployeeChange}
                    placeholder="Example: Sales Associate"
                  />
                </label>

                <label>
                  Hire Date
                  <input
                    type="date"
                    name="hireDate"
                    autoComplete="off"
                    value={employeeForm.hireDate}
                    onChange={handleEmployeeChange}
                  />
                </label>

                <h3 className="form-section-title">Pay and PTO</h3>

                <div className="pay-type-card full-width-field">
                  <PayTypeCheckboxes
                    payType={employeeForm.payType}
                    onChange={(type) =>
                      setEmployeeForm((prev) => ({
                        ...prev,
                        payType: type,
                        hourlyRate: "",
                        salaryRate: "",
                        commissionPercentage: "",
                      }))
                    }
                  />
                </div>

                {(employeeForm.payType === "HOURLY" || employeeForm.payType === "CONTRACT_1099") && (
                  <label>
                    {employeeForm.payType === "CONTRACT_1099" ? "1099 Rate ($/hr)" : "Hourly Rate ($/hr)"}
                    <input
                      type="number"
                      name="hourlyRate"
                      autoComplete="off"
                      value={employeeForm.hourlyRate}
                      onChange={handleEmployeeChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </label>
                )}

                {employeeForm.payType === "CONTRACT_1099" && (
                  <label>
                    Commission Percentage (%)
                    <input
                      type="number"
                      name="commissionPercentage"
                      autoComplete="off"
                      value={employeeForm.commissionPercentage}
                      onChange={handleEmployeeChange}
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </label>
                )}

                {employeeForm.payType === "SALARY" && (
                  <label>
                    Annual Salary ($)
                    <input
                      type="number"
                      name="salaryRate"
                      autoComplete="off"
                      value={employeeForm.salaryRate}
                      onChange={handleEmployeeChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </label>
                )}

                <label>
                  PTO Balance Hours
                  <input
                    type="number"
                    name="ptoBalanceHours"
                    autoComplete="off"
                    value={employeeForm.ptoBalanceHours}
                    onChange={handleEmployeeChange}
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </label>

                <div className="modern-form-note">
                  <span>ℹ️</span>
                  The employee can use this login to clock in, request PTO, and view their information.
                </div>

                <div className="form-actions">
                  <button type="submit" className="modern-save-btn">
                     Add Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {activeCompanyTab === "companyInfo" && (
          <div className="modern-form-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Company Info</h1>
                <p>Update your company contact details and business address.</p>
              </div>
              <div className="hero-art">🏢</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">🏢</div>
                <div>
                  <h2>Edit Company Info</h2>
                  <p>This information appears on the company profile and employee portal.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCompanyInfo} className="modern-dashboard-form">
                <h3 className="form-section-title">Basic Information</h3>

                <label>
                  Company Name
                  <input
                    type="text"
                    name="name"
                    value={companyInfoForm.name}
                    onChange={handleCompanyInfoChange}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={companyInfoForm.email}
                    onChange={handleCompanyInfoChange}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    name="phone"
                    value={companyInfoForm.phone}
                    onChange={handleCompanyInfoChange}
                  />
                </label>

                <h3 className="form-section-title">Business Address</h3>

                <label className="full-width-field">
                  Street Address
                  <input
                    type="text"
                    name="streetAddress"
                    value={companyInfoForm.streetAddress}
                    onChange={handleCompanyInfoChange}
                    placeholder="123 Main St"
                  />
                </label>

                <label className="full-width-field">
                  Address Line 2
                  <input
                    type="text"
                    name="addressLine2"
                    value={companyInfoForm.addressLine2}
                    onChange={handleCompanyInfoChange}
                    placeholder="Suite, Apt, Unit (optional)"
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    name="city"
                    value={companyInfoForm.city}
                    onChange={handleCompanyInfoChange}
                    placeholder="City"
                  />
                </label>

                <label>
                  State / Province / Region
                  <select
                    name="state"
                    value={companyInfoForm.state}
                    onChange={handleCompanyInfoChange}
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label>
                  ZIP / Postal Code
                  <input
                    type="text"
                    name="zip"
                    value={companyInfoForm.zip}
                    onChange={handleCompanyInfoChange}
                    placeholder="12345"
                  />
                </label>

                <label>
                  Country
                  <input
                    type="text"
                    name="country"
                    value={companyInfoForm.country}
                    onChange={handleCompanyInfoChange}
                    placeholder="United States"
                  />
                </label>

                <div className="modern-form-note">
                  <span>ℹ️</span>
                  Keep this information up to date so employees see the correct company contact details.
                </div>

                <div className="form-actions">
                  <button type="submit" className="modern-save-btn">
                     Save Company Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {activeCompanyTab === "settings" && (
          <div className="modern-settings-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Company Settings</h1>
                <p>Manage your payroll preferences and pay schedule settings.</p>
              </div>
              <div className="hero-art">📅</div>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon blue">📅</div>
                <div>
                  <h2>Payroll Configuration</h2>
                  <p>Set how and when your employees are paid.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCompanySettings}>
                <div className="modern-form-grid">
                  <label>
                    Payroll Type
                    <select
                      name="payrollType"
                      value={companySettingsForm.payrollType}
                      onChange={handleCompanySettingsChange}
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Bi-Weekly</option>
                      <option value="SEMI_MONTHLY">Semi-Monthly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                    </select>
                  </label>

                  <label>
                    Payday
                    <select
                      name="payday"
                      value={companySettingsForm.payday}
                      onChange={handleCompanySettingsChange}
                    >
                      {companySettingsForm.payrollType === "SEMI_MONTHLY"
                        ? SEMI_MONTHLY_PAYDAYS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))
                        : companySettingsForm.payrollType === "MONTHLY" || companySettingsForm.payrollType === "QUARTERLY"
                          ? MONTHLY_PAYDAYS.map((day) => (
                              <option key={day} value={day}>
                                {companySettingsForm.payrollType === "QUARTERLY"
                                  ? `${formatDayOfMonth(day)} of each quarter-ending month`
                                  : `${formatDayOfMonth(day)} of each month`}
                              </option>
                            ))
                        : WEEKDAY_PAYDAYS.map((d) => (
                            <option key={d} value={d}>
                              {formatPayday(companySettingsForm.payrollType, d)}
                            </option>
                          ))}
                    </select>
                  </label>

                  {companySettingsForm.payrollType === "BIWEEKLY" && (
                    <label>
                      Pay Period Start Date
                      <input
                        type="date"
                        name="biweeklyStartDate"
                        value={companySettingsForm.biweeklyStartDate}
                        onChange={handleCompanySettingsChange}
                        required
                      />
                    </label>
                  )}
                </div>

                <div className="settings-bottom-row">
                  <div className="settings-info-box">
                    <span>ℹ️</span>
                    These settings determine how often payroll runs and the day employees are paid.
                  </div>

                  <button type="submit" className="modern-save-btn">
                    💾 Save Settings
                  </button>
                </div>
              </form>
            </div>

            <div className="modern-card">
              <div className="modern-card-header">
                <div className="modern-icon green">📋</div>
                <div>
                  <h2>Current Payroll Settings</h2>
                  <p>Overview of your active payroll configuration.</p>
                </div>
              </div>

              {(() => {
                const period = getPayrollPeriod();

                return (
                  <>
                    <div className="payroll-overview-card">
                      <span className="active-badge">Active</span>

                      <div className="payroll-overview-item">
                        <div className="overview-icon">📅</div>
                        <div>
                          <span>Payroll Type</span>
                          <strong>{formatPayrollType(companySettingsForm.payrollType)}</strong>
                        </div>
                      </div>

                      <div className="payroll-overview-item">
                        <div className="overview-icon">🗓️</div>
                        <div>
                          <span>Payday</span>
                          <strong>{formatPayday(companySettingsForm.payrollType, companySettingsForm.payday)}</strong>
                        </div>
                      </div>

                      <div className="payroll-overview-item">
                        <div className="overview-icon">🕒</div>
                        <div>
                          <span>Current Pay Period</span>
                          <strong>
                            {period.startText} — {period.endText}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="settings-explain-box">
                      <span>ℹ️</span>
                      <div>
                        <strong>What does this mean?</strong>
                        <p>
                          Payroll is calculated{" "}
                          {companySettingsForm.payrollType === "BIWEEKLY"
                            ? "every two weeks"
                            : companySettingsForm.payrollType === "SEMI_MONTHLY"
                              ? "twice a month"
                              : companySettingsForm.payrollType === "MONTHLY"
                                ? "once a month"
                                : companySettingsForm.payrollType === "QUARTERLY"
                                  ? "once a quarter"
                              : "every week"}{" "}
                          and employees will be paid on{" "}
                          {formatPayday(companySettingsForm.payrollType, companySettingsForm.payday)}.
                          The current pay period is {period.startText} through {period.endText}.
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
    {activeCompanyTab === "documents" && (
      <DocumentsPanel companyId={id} canUpload={true} />
    )}
    {activeCompanyTab === "payroll" && (
      <PayrollPanel
        companyId={id}
        employees={employees}
        period={getPayrollPeriod()}
        payrollType={companySettingsForm.payrollType}
        payday={companySettingsForm.payday}
      />
    )}
    {activeCompanyTab === "commissions" && (
      <CommissionPanel companyId={id} employees={employees} />
    )}
    {activeCompanyTab === "billing" && (
      <div className="modern-form-page">
        <div className="modern-settings-hero">
          <div>
            <h1>Billing</h1>
            <p>View plan, subscription status, invoices, and cancellation options.</p>
          </div>
          <div className="hero-art">💳</div>
        </div>

        <div className="modern-card billing-card">
          <div className="modern-card-header">
            <div className="modern-icon blue">💳</div>
            <div>
              <h2>Subscription</h2>
              <p>Billing details are managed through Stripe for paid plans.</p>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          {billingLoading ? (
            <p>Loading billing details...</p>
          ) : (
            <>
              <div className="billing-detail-grid">
                <div className="billing-detail-item">
                  <span>View plan</span>
                  <strong>{billingDetails?.planName || company.planName || "Free Trial"}</strong>
                </div>
                <div className="billing-detail-item">
                  <span>View status</span>
                  <strong>{formatBillingValue(billingDetails?.billingStatus || company.billingStatus || company.stripeSubscriptionStatus)}</strong>
                </div>
                <div className="billing-detail-item">
                  <span>View next billing date</span>
                  <strong>{billingDetails?.nextBillingDate || "Not available"}</strong>
                </div>
              </div>

              <div className="billing-actions">
                <button type="button" className="modern-save-btn" onClick={handleOpenInvoices}>
                  {invoiceLoading ? "Loading invoices..." : "View invoices via Stripe"}
                </button>
                <button type="button" className="billing-cancel-btn" onClick={() => setShowCancelConfirm(true)}>
                  Cancel subscription
                </button>
              </div>

              {invoiceMessage && <p className="billing-empty-message">{invoiceMessage}</p>}

              {invoices.length > 0 && (
                <div className="billing-invoice-table">
                  <div className="billing-invoice-row billing-invoice-row--header">
                    <span>Date</span>
                    <span>Amount paid</span>
                    <span>Status</span>
                    <span>Links</span>
                  </div>
                  {invoices.map((invoice, index) => (
                    <div className="billing-invoice-row" key={`${invoice.hostedInvoiceUrl || invoice.invoicePdf || index}`}>
                      <span>{invoice.invoiceDate || "Not available"}</span>
                      <span>{formatCurrencyFromCents(invoice.amountPaid)}</span>
                      <span>{formatBillingValue(invoice.status)}</span>
                      <span className="billing-invoice-links">
                        {invoice.hostedInvoiceUrl && (
                          <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">Invoice</a>
                        )}
                        {invoice.invoicePdf && (
                          <a href={invoice.invoicePdf} target="_blank" rel="noreferrer">PDF</a>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {showCancelConfirm && (
          <div className="plan-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title">
            <div className="plan-confirm-modal">
              <h2 id="cancel-subscription-title">Are you sure you want to cancel subscription?</h2>
              <p>This will cancel the subscription and this company account will not be able to log back in.</p>
              <div className="plan-confirm-actions">
                <button type="button" className="billing-cancel-confirm-btn" onClick={handleCancelSubscription}>
                  Yes
                </button>
                <button type="button" onClick={() => setShowCancelConfirm(false)}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
{activeCompanyTab === "password" && (
  <div className="modern-form-page">
    <div className="modern-settings-hero">
      <div>
        <h1>Change Password</h1>
        <p>Update the company admin password used to access this portal.</p>
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

      <form onSubmit={handleChangeCompanyPassword} className="modern-dashboard-form password-dashboard-form">
        <h3 className="form-section-title">Verify Current Password</h3>

        <label className="full-width-field">
          Current Password
          <input
            type="password"
            name="currentPassword"
            value={companyPasswordForm.currentPassword}
            onChange={handleCompanyPasswordChange}
            required
          />
        </label>

        <h3 className="form-section-title">Create New Password</h3>

        <label>
          New Password
          <input
            type="password"
            name="newPassword"
            value={companyPasswordForm.newPassword}
            onChange={handleCompanyPasswordChange}
            required
          />
        </label>

        <label>
          Confirm New Password
          <input
            type="password"
            name="confirmPassword"
            value={companyPasswordForm.confirmPassword}
            onChange={handleCompanyPasswordChange}
            required
          />
        </label>

        <div className="modern-form-note password-note">
          <span>ℹ️</span>
          Use a strong password with a mix of uppercase letters, lowercase letters, numbers, and symbols.
        </div>

        <div className="password-checklist full-width-field">
          <div>
            <span>✓</span>
            Use at least 8 characters
          </div>
          <div>
            <span>✓</span>
            Avoid using your company name or email
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

      </div>
    </div>
  );
}

export default CompaniesPage;
