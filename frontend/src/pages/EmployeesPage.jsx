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

const SEMI_MONTHLY_PAYDAYS = [
  { value: "FIRST_FIFTEENTH", label: "1st and 15th" },
  { value: "FIFTEENTH_THIRTIETH", label: "15th and 30th" },
];

function formatPayrollType(type) {
  if (type === "BIWEEKLY") return "Bi-weekly";
  if (type === "SEMI_MONTHLY") return "Semi-monthly";
  return "Weekly";
}

function formatPayday(payrollType, payday) {
  if (payrollType === "SEMI_MONTHLY") {
    return SEMI_MONTHLY_PAYDAYS.find((option) => option.value === payday)?.label || "1st and 15th";
  }

  const day = payday || "FRIDAY";
  return day.charAt(0) + day.slice(1).toLowerCase();
}

function formatCompensation(employee) {
  if (employee.payType === "SALARY") {
    return `$${Number(employee.salaryRate || 0).toLocaleString()}/yr (Salary)`;
  }

  if (employee.payType === "CONTRACT_1099") {
    return `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr (1099)`;
  }

  return `$${Number(employee.hourlyRate || 0).toFixed(2)}/hr (Hourly)`;
}

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

function getSemiMonthlyInfo(payday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let periodEnd = null;
  let previousPayday = null;
  let nextPayday = null;

  for (let offset = -1; offset <= 1; offset += 1) {
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
      } else if (!nextPayday) {
        nextPayday = candidate;
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
    periodStart: addDays(previousPayday, 1),
    periodEnd,
    nextPayday: nextPayday || addDays(periodEnd, 15),
  };
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
  } else if (payrollType === "SEMI_MONTHLY") {
    const semiMonthlyInfo = getSemiMonthlyInfo(payday || "FIRST_FIFTEENTH");

    periodStart = semiMonthlyInfo.periodStart;
    periodEnd = semiMonthlyInfo.periodEnd;
    nextPayday = semiMonthlyInfo.nextPayday;
  } else {
    const paydayDate = getMostRecentWeekday(payday);

    periodStart = addDays(paydayDate, -6);
    periodEnd = paydayDate;
    nextPayday = addDays(paydayDate, 7);
  }

  return { periodStart, periodEnd, nextPayday, payrollType, payday };
}

function getCurrentPayrollPeriod(company) {
  const payrollInfo = getPayrollInfo(company);
  if (!payrollInfo) return null;

  return {
    periodStart: payrollInfo.periodStart,
    periodEnd: payrollInfo.periodEnd,
    payrollType: payrollInfo.payrollType,
    payday: payrollInfo.payday,
  };
}

function getPreviousSemiMonthlyPeriod(period, payday) {
  const payDates = [];

  for (let offset = -2; offset <= 0; offset += 1) {
    const monthCursor = new Date(period.periodEnd.getFullYear(), period.periodEnd.getMonth() + offset, 1);

    for (let index = 0; index < 2; index += 1) {
      payDates.push(
        getSemiMonthlyPayDate(
          payday,
          monthCursor.getFullYear(),
          monthCursor.getMonth(),
          index
        )
      );
    }
  }

  const sortedPayDates = payDates.sort((a, b) => a - b);
  const currentIndex = sortedPayDates.findIndex((date) => date.getTime() === period.periodEnd.getTime());
  const previousEnd = sortedPayDates[currentIndex - 1];
  const previousPreviousEnd = sortedPayDates[currentIndex - 2];

  if (!previousEnd || !previousPreviousEnd) {
    const previousMonth = new Date(period.periodEnd.getFullYear(), period.periodEnd.getMonth() - 1, 1);
    const fallbackEnd = getSemiMonthlyPayDate(
      payday,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      1
    );

    return {
      periodStart: addDays(fallbackEnd, -14),
      periodEnd: fallbackEnd,
      payrollType: period.payrollType,
      payday,
    };
  }

  return {
    periodStart: addDays(previousPreviousEnd, 1),
    periodEnd: previousEnd,
    payrollType: period.payrollType,
    payday,
  };
}

function getPreviousPayrollPeriod(period, company) {
  if (!period) return null;

  if (period.payrollType === "BIWEEKLY") {
    const previousEnd = addDays(period.periodStart, -1);
    return {
      periodStart: addDays(previousEnd, -13),
      periodEnd: previousEnd,
      payrollType: period.payrollType,
      payday: period.payday,
    };
  }

  if (period.payrollType === "SEMI_MONTHLY") {
    return getPreviousSemiMonthlyPeriod(period, company?.payday || "FIRST_FIFTEENTH");
  }

  const previousEnd = addDays(period.periodStart, -1);
  return {
    periodStart: addDays(previousEnd, -6),
    periodEnd: previousEnd,
    payrollType: period.payrollType,
    payday: period.payday,
  };
}

function buildPayStubPeriods(company, count = 120, earliestDate = null) {
  const periods = [];
  let currentPeriod = getCurrentPayrollPeriod(company);
  const earliest = earliestDate ? new Date(earliestDate) : null;
  if (earliest) earliest.setHours(0, 0, 0, 0);

  while (currentPeriod && periods.length < count) {
    periods.push({
      ...currentPeriod,
      id: `${currentPeriod.periodStart.toISOString()}-${currentPeriod.periodEnd.toISOString()}`,
    });

    if (earliest && currentPeriod.periodStart <= earliest) {
      break;
    }

    currentPeriod = getPreviousPayrollPeriod(currentPeriod, company);
  }

  return periods;
}

function getEarliestPayStubDate(employee, timeEntries, ptoRequests) {
  const dates = [];

  if (employee?.hireDate) {
    dates.push(new Date(`${employee.hireDate}T00:00:00`));
  }

  timeEntries.forEach((entry) => {
    if (entry.clockInTime) {
      dates.push(new Date(entry.clockInTime));
    }
  });

  ptoRequests.forEach((request) => {
    if (request.startDate) {
      dates.push(new Date(`${request.startDate}T00:00:00`));
    }
  });

  return dates.length ? new Date(Math.min(...dates)) : null;
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

function isDateInPeriod(date, periodStart, periodEnd) {
  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(periodEnd);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function calcApprovedPtoHoursInPeriod(ptoRequests, periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return 0;

  return ptoRequests
    .filter((request) => request.status === "APPROVED")
    .reduce((sum, request) => {
      if (!request.startDate || !request.endDate) return sum;

      const requestStart = new Date(`${request.startDate}T00:00:00`);
      const requestEnd = new Date(`${request.endDate}T00:00:00`);
      const totalDays = Math.max(1, Math.round((requestEnd - requestStart) / 86400000) + 1);
      const hoursPerDay = Number(request.hoursRequested || 0) / totalDays;
      let periodHours = 0;
      const current = new Date(requestStart);

      while (current <= requestEnd) {
        if (isDateInPeriod(current, periodStart, periodEnd)) {
          periodHours += hoursPerDay;
        }

        current.setDate(current.getDate() + 1);
      }

      return sum + periodHours;
    }, 0);
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function formatPdfDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPayStubFileDate(date) {
  return formatPdfDate(date).replace(",", "").replace(/\s+/g, "-");
}

function sanitizePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function getRegularHoursForStub(employee, payStub) {
  if (employee.payType === "HOURLY") {
    return Math.min(payStub.workedHours, 40);
  }

  return payStub.workedHours;
}

function buildPdfTextLine(x, y, text, size = 10, color = "0.07 0.12 0.20") {
  return `${color} rg BT /F1 ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`;
}

function buildPayStubPdf({ company, employee, payStub, period }) {
  const companyName = company?.name || employee.companyName || "Company";
  const employeeName = employee.name || `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  const payPeriod = `${formatPdfDate(period.periodStart)} to ${formatPdfDate(period.periodEnd)}`;
  const regularHours = getRegularHoursForStub(employee, payStub);
  const ptoRemaining = Number(employee.ptoBalanceHours || 0);
  const disclaimerLineOne =
    "This pay stub is an earnings summary generated by the ESS Portal.";
  const disclaimerLineTwo =
    "Actual deductions, taxes, and net pay may vary based on the employer's payroll provider.";

  const lines = [
    "0.9 0.95 1 rg 40 708 532 64 re f",
    "0.12 0.23 0.48 rg 40 708 532 64 re S",
    buildPdfTextLine(58, 744, companyName, 18, "0.02 0.18 0.46"),
    buildPdfTextLine(58, 722, "Pay Stub", 14, "0.02 0.18 0.46"),
    buildPdfTextLine(352, 744, `Pay Period: ${payPeriod}`, 8.5, "0.02 0.18 0.46"),
    buildPdfTextLine(352, 724, `Generated: ${formatPdfDate(new Date())}`, 9, "0.02 0.18 0.46"),

    buildPdfTextLine(40, 676, "Employee Information", 13, "0.02 0.18 0.46"),
    "0.92 0.92 0.92 rg 40 664 532 1 re f",
    buildPdfTextLine(58, 642, `Employee Name: ${employeeName}`),
    buildPdfTextLine(58, 622, `Employee Email: ${employee.email || "N/A"}`),
    buildPdfTextLine(58, 602, `Employee ID: ${employee.id}`),
    buildPdfTextLine(58, 582, `Company: ${companyName}`),
    buildPdfTextLine(330, 642, `Pay Type: ${payStub.payTypeLabel}`),
    buildPdfTextLine(330, 622, `Rate of Pay: ${payStub.payRateText}`),
    buildPdfTextLine(330, 602, `Pay Period: ${payPeriod}`),

    buildPdfTextLine(40, 558, "Earnings", 13, "0.02 0.18 0.46"),
    "0.92 0.92 0.92 rg 40 546 532 1 re f",
    buildPdfTextLine(58, 524, `Regular Hours: ${regularHours.toFixed(2)} hrs`),
    buildPdfTextLine(58, 504, `Overtime Hours: ${payStub.overtimeHours.toFixed(2)} hrs`),
    buildPdfTextLine(58, 484, `PTO Hours: ${payStub.ptoHours.toFixed(2)} hrs`),

    buildPdfTextLine(40, 440, "PTO", 13, "0.02 0.18 0.46"),
    "0.92 0.92 0.92 rg 40 428 532 1 re f",
    buildPdfTextLine(58, 406, `PTO Hours Used: ${payStub.ptoHours.toFixed(2)} hrs`),
    buildPdfTextLine(58, 386, `PTO Remaining: ${ptoRemaining.toFixed(2)} hrs`),
    buildPdfTextLine(330, 406, `PTO Pay Value: ${formatCurrency(payStub.ptoValue)}`),

    "0.90 0.98 0.94 rg 40 300 532 72 re f",
    "0.04 0.47 0.28 rg 40 300 532 72 re S",
    buildPdfTextLine(58, 342, "Estimated Gross Earnings", 15, "0.02 0.48 0.28"),
    buildPdfTextLine(410, 336, formatCurrency(payStub.grossPay), 20, "0.02 0.48 0.28"),

    buildPdfTextLine(40, 96, disclaimerLineOne, 8),
    buildPdfTextLine(40, 82, disclaimerLineTwo, 8),
  ];

  const stream = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function downloadPayStubPdf({ company, employee, payStub, period }) {
  const pdf = buildPayStubPdf({ company, employee, payStub, period });
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pay-stub-${formatPayStubFileDate(period.periodStart)}-to-${formatPayStubFileDate(period.periodEnd)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getPayRate(employee) {
  if (employee.payType === "SALARY") return Number(employee.salaryRate || 0);
  return Number(employee.hourlyRate || 0);
}

function getPayTypeLabel(payType) {
  if (payType === "SALARY") return "Salary";
  if (payType === "CONTRACT_1099") return "1099";
  return "Hourly";
}

function getPayRateText(employee) {
  if (employee.payType === "SALARY") {
    return `${formatCurrency(employee.salaryRate)}/yr`;
  }

  return `${formatCurrency(employee.hourlyRate)}/hr`;
}

function buildPayStub(employee, timeEntries, ptoRequests, payrollInfo) {
  if (!employee || !payrollInfo) return null;

  const workedHours = calcHoursInPeriod(timeEntries, payrollInfo.periodStart, payrollInfo.periodEnd);
  const ptoHours = employee.payType === "CONTRACT_1099"
    ? 0
    : calcApprovedPtoHoursInPeriod(ptoRequests, payrollInfo.periodStart, payrollInfo.periodEnd);
  const hourlyRate = Number(employee.hourlyRate || 0);
  const ptoRate = employee.payType === "SALARY"
    ? Number(employee.salaryRate || 0) / 2080
    : hourlyRate;
  const regularWorkedHours = Math.min(workedHours, 40);
  const overtimeHours = employee.payType === "HOURLY" ? Math.max(workedHours - 40, 0) : 0;
  const ptoValue = ptoHours * ptoRate;
  let grossPay = 0;

  if (employee.payType === "SALARY") {
    const days =
      (new Date(payrollInfo.periodEnd) - new Date(payrollInfo.periodStart)) / 86400000 + 1;
    grossPay = (Number(employee.salaryRate || 0) / 365) * days;
  } else if (employee.payType === "CONTRACT_1099") {
    grossPay = workedHours * hourlyRate;
  } else {
    grossPay = regularWorkedHours * hourlyRate + overtimeHours * hourlyRate * 1.5 + ptoValue;
  }

  return {
    workedHours,
    ptoHours,
    ptoValue,
    overtimeHours,
    grossPay,
    payTypeLabel: getPayTypeLabel(employee.payType),
    payRateText: getPayRateText(employee),
    rate: getPayRate(employee),
    ptoRate,
  };
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
  const [selectedPayStubPeriodId, setSelectedPayStubPeriodId] = useState(null);

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
    if (tab !== "paystub") {
      setSelectedPayStubPeriodId(null);
    }
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
  const earliestPayStubDate = getEarliestPayStubDate(employee, timeEntries, ptoRequests);
  const payStubPeriods = buildPayStubPeriods(company, 120, earliestPayStubDate).filter((period) => {
    const periodStub = buildPayStub(employee, timeEntries, ptoRequests, period);
    return periodStub.workedHours > 0 || periodStub.ptoHours > 0;
  });
  const selectedPayStubPeriod = payStubPeriods.find((period) => period.id === selectedPayStubPeriodId);
  const selectedPayStub = selectedPayStubPeriod
    ? buildPayStub(employee, timeEntries, ptoRequests, selectedPayStubPeriod)
    : null;
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
            {formatCompensation(employee)}
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
            className={`employee-tab${activeTab === "paystub" ? " employee-tab--active" : ""}`}
            onClick={() => handleTabChange("paystub")}
          >
            Pay Stub
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
                  sub={`${formatPayrollType(payrollInfo.payrollType)} · ${formatPayday(payrollInfo.payrollType, payrollInfo.payday)}`}
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

        {activeTab === "paystub" && (
          <div className="employee-modern-page">
            <div className="modern-settings-hero">
              <div>
                <h1>Pay Stub</h1>
                <p>Choose a pay period to review hours, PTO, and estimated gross pay.</p>
              </div>
              <div className="hero-art">Pay</div>
            </div>

            {!payrollInfo || payStubPeriods.length === 0 ? (
              <div className="modern-card">
                <div className="empty-state-card workspace-empty">
                  <h3>No pay stubs yet</h3>
                  <p>Pay stubs will appear after worked time or approved PTO exists for a pay period.</p>
                </div>
              </div>
            ) : !selectedPayStubPeriod || !selectedPayStub ? (
              <div className="modern-card">
                <div className="modern-card-header">
                  <div className="modern-icon blue">Pay</div>
                  <div>
                    <h2>Pay Stub History</h2>
                    <p>Click a pay period to open the pay stub details.</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    maxHeight: 520,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {payStubPeriods.map((period) => {
                    const periodStub = buildPayStub(employee, timeEntries, ptoRequests, period);

                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setSelectedPayStubPeriodId(period.id)}
                        style={{
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 12,
                          alignItems: "center",
                          padding: "14px 16px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          background: "#fff",
                          color: "#111827",
                          cursor: "pointer",
                          textAlign: "left",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        <span>
                          <strong style={{ display: "block", marginBottom: 4 }}>
                            {toDateStr(period.periodStart)} - {toDateStr(period.periodEnd)}
                          </strong>
                          <span style={{ color: "#6b7280", fontSize: "0.86rem" }}>
                            {formatPayrollType(period.payrollType)} period · {periodStub.workedHours.toFixed(2)} hrs worked
                          </span>
                        </span>

                        <strong style={{ color: "#3d52c4" }}>
                          {formatCurrency(periodStub.grossPay)}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="modern-card compact-card">
                  <div className="modern-card-header">
                    <div className="modern-icon green">Pay</div>
                    <div>
                      <h2>Pay Period</h2>
                      <p>{toDateStr(selectedPayStubPeriod.periodStart)} - {toDateStr(selectedPayStubPeriod.periodEnd)}</p>
                    </div>
                  </div>

                  <div className="form-actions pay-stub-actions">
                    <button
                      type="button"
                      onClick={() =>
                        downloadPayStubPdf({
                          company,
                          employee,
                          payStub: selectedPayStub,
                          period: selectedPayStubPeriod,
                        })
                      }
                      className="modern-save-btn"
                    >
                      Download Pay Stub PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayStubPeriodId(null)}
                      className="modern-save-btn"
                    >
                      Close Pay Stub
                    </button>
                  </div>
                </div>

                <div className="overview-card-grid">
                  <OverviewCard
                    label="Hours Worked"
                    value={`${selectedPayStub.workedHours.toFixed(2)} hrs`}
                    sub="Selected pay period"
                  />

                  <OverviewCard
                    label="Pay Type"
                    value={selectedPayStub.payTypeLabel}
                    sub={selectedPayStub.payRateText}
                  />

                  {employee.payType !== "CONTRACT_1099" && (
                    <OverviewCard
                      label="PTO Remaining"
                      value={`${Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs`}
                      sub="Available balance"
                    />
                  )}

                  <OverviewCard
                    label="Gross Pay"
                    value={formatCurrency(selectedPayStub.grossPay)}
                    sub="Estimated before deductions"
                  />
                </div>

                {employee.payType === "CONTRACT_1099" ? (
                  <div className="modern-card">
                    <div className="modern-card-header">
                      <div className="modern-icon blue">1099</div>
                      <div>
                        <h2>1099 Pay Summary</h2>
                        <p>Gross pay is calculated from hours worked times your 1099 rate.</p>
                      </div>
                    </div>

                    <div className="workspace-payroll-grid">
                      <p><strong>Hours Worked:</strong> {selectedPayStub.workedHours.toFixed(2)} hrs</p>
                      <p><strong>1099 Rate:</strong> {selectedPayStub.payRateText}</p>
                      <p className="gross-pay-highlight">
                        <strong>Gross Pay:</strong> {formatCurrency(selectedPayStub.grossPay)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="modern-card">
                    <div className="modern-card-header">
                      <div className="modern-icon blue">Pay</div>
                      <div>
                        <h2>Pay Details</h2>
                        <p>Includes worked hours, approved PTO used in this period, and estimated gross pay.</p>
                      </div>
                    </div>

                    <div className="workspace-payroll-grid">
                      <p><strong>Hours Worked:</strong> {selectedPayStub.workedHours.toFixed(2)} hrs</p>
                      <p><strong>Pay Type:</strong> {selectedPayStub.payTypeLabel}</p>
                      <p><strong>Rate of Pay:</strong> {selectedPayStub.payRateText}</p>

                      {employee.payType === "HOURLY" && (
                        <p><strong>Overtime Hours:</strong> {selectedPayStub.overtimeHours.toFixed(2)} hrs</p>
                      )}

                      <p><strong>PTO Remaining:</strong> {Number(employee.ptoBalanceHours || 0).toFixed(2)} hrs</p>

                      {selectedPayStub.ptoHours > 0 ? (
                        <>
                          <p><strong>PTO Used:</strong> {selectedPayStub.ptoHours.toFixed(2)} hrs</p>
                          <p>
                            <strong>PTO Pay Value:</strong>{" "}
                            {formatCurrency(selectedPayStub.ptoValue)}
                            {" "}
                            ({selectedPayStub.ptoHours.toFixed(2)} hrs x {formatCurrency(selectedPayStub.ptoRate)}/hr)
                          </p>
                        </>
                      ) : (
                        <p><strong>PTO Used:</strong> 0.00 hrs</p>
                      )}

                      <p className="gross-pay-highlight">
                        <strong>Gross Pay:</strong> {formatCurrency(selectedPayStub.grossPay)}
                      </p>
                    </div>
                  </div>
                )}
              </>
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
          <DocumentsPanel
            companyId={employee.companyId}
            employeeId={id}
            employeePayType={employee.payType}
            canUpload={false}
          />
        )}
      </div>
    </div>
  );
}

export default EmployeesPage;
