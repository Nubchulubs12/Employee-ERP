import { useEffect, useMemo, useState } from "react";
import { fetchCompanyPtoRequests, fetchTimeEntries } from "../api/employeeApi";
import { fetchCompanyCommissions } from "../api/commissionApi";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatHours(value) {
  return Number(value || 0).toFixed(2);
}

function pdfText(value) {
  return String(value ?? "").replace(/[^\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPayrollPdf(rows, summary, period) {
  const lines = [
    `BT /F1 18 Tf 40 750 Td (Company Payroll Summary) Tj ET`,
    `BT /F1 10 Tf 40 730 Td (${pdfText(`${formatDisplayDate(period.start)} to ${formatDisplayDate(period.end)}`)}) Tj ET`,
    `BT /F1 10 Tf 40 710 Td (${pdfText(`Commission: ${formatMoney(summary.commissionPay)}   Gross Pay: ${formatMoney(summary.grossPay)}`)}) Tj ET`,
    `BT /F1 9 Tf 40 682 Td (Employee) Tj ET`,
    `BT /F1 9 Tf 260 682 Td (Base Pay) Tj ET`,
    `BT /F1 9 Tf 365 682 Td (Commission) Tj ET`,
    `BT /F1 9 Tf 475 682 Td (Gross Pay) Tj ET`,
  ];
  rows.slice(0, 24).forEach((row, index) => {
    const y = 662 - index * 24;
    lines.push(`BT /F1 8 Tf 40 ${y} Td (${pdfText(row.employeeName).slice(0, 38)}) Tj ET`);
    lines.push(`BT /F1 8 Tf 260 ${y} Td (${pdfText(formatMoney(row.basePay))}) Tj ET`);
    lines.push(`BT /F1 8 Tf 365 ${y} Td (${pdfText(formatMoney(row.commissionPay))}) Tj ET`);
    lines.push(`BT /F1 8 Tf 475 ${y} Td (${pdfText(formatMoney(row.grossPay))}) Tj ET`);
  });
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
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  return `${pdf}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
}

function formatDisplayDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildPeriodOptions(currentPeriod, count = 12, payrollType = "WEEKLY", payday = "1") {
  const start = new Date(currentPeriod.start);
  const end = new Date(currentPeriod.end);

  if (payrollType === "QUARTERLY") {
    return Array.from({ length: count }, (_, index) => {
      const optionEndMonth = end.getMonth() - index * 3;
      const optionEndYear = end.getFullYear();
      const optionEndDay = Math.min(
        Number(payday) || 1,
        new Date(optionEndYear, optionEndMonth + 1, 0).getDate()
      );
      const optionEnd = new Date(optionEndYear, optionEndMonth, optionEndDay);
      const previousEndMonth = optionEnd.getMonth() - 3;
      const previousEndDay = Math.min(
        Number(payday) || 1,
        new Date(optionEnd.getFullYear(), previousEndMonth + 1, 0).getDate()
      );
      const optionStart = addDays(
        new Date(optionEnd.getFullYear(), previousEndMonth, previousEndDay),
        1
      );
      const startText = formatDateKey(optionStart);
      const endText = formatDateKey(optionEnd);

      return {
        value: `${startText}|${endText}`,
        start: optionStart,
        end: optionEnd,
        startText,
        endText,
        label: `${formatDisplayDate(optionStart)} to ${formatDisplayDate(optionEnd)}`,
      };
    });
  }

  const periodDays = Math.max(
    1,
    Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
  );

  return Array.from({ length: count }, (_, index) => {
    const optionStart = addDays(start, -periodDays * index);
    const optionEnd = addDays(end, -periodDays * index);
    const startText = formatDateKey(optionStart);
    const endText = formatDateKey(optionEnd);

    return {
      value: `${startText}|${endText}`,
      start: optionStart,
      end: optionEnd,
      startText,
      endText,
      label: `${formatDisplayDate(optionStart)} to ${formatDisplayDate(optionEnd)}`,
    };
  });
}

function formatPayType(type) {
  if (type === "SALARY") return "Salary";
  if (type === "CONTRACT_1099") return "1099";
  return "Hourly";
}

function getEmployeeName(employee) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email || "Employee";
}

function getHourlyRate(employee) {
  if (employee.payType !== "HOURLY") return "0.00";
  return Number(employee.hourlyRate || 0).toFixed(2);
}

function getSalaryRate(employee) {
  if (employee.payType !== "SALARY") return "0.00";
  return Number(employee.salaryRate || 0).toFixed(2);
}

function getContractRate(employee) {
  if (employee.payType !== "CONTRACT_1099") return "0.00";
  return Number(employee.hourlyRate || 0).toFixed(2);
}

function getEntryDate(entry) {
  if (entry.isPto) return new Date(`${entry.workDate}T00:00:00`);
  if (entry.clockInTime) return new Date(entry.clockInTime);
  if (entry.workDate) return new Date(`${entry.workDate}T00:00:00`);
  return null;
}

function isEntryInPeriod(entry, start, end) {
  const entryDate = getEntryDate(entry);
  if (!entryDate || Number.isNaN(entryDate.getTime())) return false;

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  return entryDate >= startDate && entryDate <= endDate;
}

function calculateTimeEntryHours(entry) {
  if (!entry.clockInTime || !entry.clockOutTime) return 0;

  const clockIn = new Date(entry.clockInTime);
  const clockOut = new Date(entry.clockOutTime);

  if (
    Number.isNaN(clockIn.getTime()) ||
    Number.isNaN(clockOut.getTime()) ||
    clockOut <= clockIn
  ) {
    return 0;
  }

  return (clockOut - clockIn) / (1000 * 60 * 60);
}

function buildPtoEntries(requests = []) {
  return requests
    .filter((request) => request.status === "APPROVED")
    .flatMap((request) => {
      if (!request.startDate || !request.endDate) return [];

      const start = new Date(`${request.startDate}T00:00:00`);
      const end = new Date(`${request.endDate}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

      const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      const hoursPerDay = Number(request.hoursRequested || 0) / totalDays;
      const entries = [];
      const current = new Date(start);

      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        const workDate = `${year}-${month}-${day}`;

        entries.push({
          employeeId: request.employeeId,
          employeeName: request.employeeName,
          workDate,
          ptoHours: hoursPerDay,
          isPto: true,
        });

        current.setDate(current.getDate() + 1);
      }

      return entries;
    });
}

function calculateEmployeePayroll(employee, timeEntries, ptoEntries, commissions, period) {
  const periodTimeEntries = timeEntries.filter((entry) =>
    isEntryInPeriod(entry, period.start, period.end)
  );
  const periodPtoEntries = ptoEntries.filter((entry) =>
    isEntryInPeriod(entry, period.start, period.end)
  );

  const workedHours = periodTimeEntries.reduce(
    (sum, entry) => sum + calculateTimeEntryHours(entry),
    0
  );
  const ptoHours = periodPtoEntries.reduce((sum, entry) => sum + Number(entry.ptoHours || 0), 0);

  let regularHours = Math.min(workedHours, 40);
  let overtimeHours = Math.max(workedHours - 40, 0);
  let grossPay = 0;

  if (employee.payType === "SALARY") {
    const annualSalary = Number(employee.salaryRate || 0);
    const periodDays = (new Date(period.end) - new Date(period.start)) / (1000 * 60 * 60 * 24) + 1;
    grossPay = (annualSalary / 365) * periodDays;
    overtimeHours = 0;
  } else {
    const hourlyRate = Number(employee.hourlyRate || 0);
    if (employee.payType === "CONTRACT_1099") {
      regularHours = workedHours;
      overtimeHours = 0;
      grossPay = (workedHours + ptoHours) * hourlyRate;
    } else {
      grossPay = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5 + ptoHours * hourlyRate;
    }
  }

  const basePay = grossPay;
  const employeeCommissions = commissions.filter(
    (entry) => Number(entry.employeeId) === Number(employee.id)
  );
  const commissionPay = employeeCommissions.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0
  );
  grossPay += commissionPay;

  return {
    employeeId: employee.id,
    employeeName: getEmployeeName(employee),
    employeeEmail: employee.email || "",
    payType: formatPayType(employee.payType),
    regularHours,
    overtimeHours,
    ptoHours,
    hourlyRate: getHourlyRate(employee),
    salaryRate: getSalaryRate(employee),
    contractRate: getContractRate(employee),
    commissionCount: employeeCommissions.length,
    basePay,
    commissionPay,
    grossPay,
    status: "Ready",
  };
}

export default function PayrollPanel({ companyId, employees = [], period, payrollType, payday }) {
  const periodOptions = useMemo(
    () => buildPeriodOptions(period, 12, payrollType, payday),
    [period, payrollType, payday]
  );
  const [payrollRows, setPayrollRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [selectedPeriodValue, setSelectedPeriodValue] = useState(() => {
    const start = formatDateKey(new Date(period.start));
    const end = formatDateKey(new Date(period.end));
    return `${start}|${end}`;
  });

  const selectedPeriod =
    periodOptions.find((option) => option.value === selectedPeriodValue) ||
    periodOptions[0];

  useEffect(() => {
    if (!periodOptions.some((option) => option.value === selectedPeriodValue)) {
      const timer = window.setTimeout(() => {
        setSelectedPeriodValue(periodOptions[0].value);
        setLoaded(false);
        setPayrollRows([]);
        setExportMessage("");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [periodOptions, selectedPeriodValue]);

  const summary = useMemo(() => {
    return payrollRows.reduce(
      (totals, row) => ({
        totalEmployees: totals.totalEmployees + 1,
        regularHours: totals.regularHours + row.regularHours,
        overtimeHours: totals.overtimeHours + row.overtimeHours,
        ptoHours: totals.ptoHours + row.ptoHours,
        commissionPay: totals.commissionPay + row.commissionPay,
        grossPay: totals.grossPay + row.grossPay,
      }),
      {
        totalEmployees: 0,
        regularHours: 0,
        overtimeHours: 0,
        ptoHours: 0,
        commissionPay: 0,
        grossPay: 0,
      }
    );
  }, [payrollRows]);

  async function handleLoadPayroll() {
    setLoading(true);
    setError("");
    setExportMessage("");

    try {
      const [employeeTimeResults, ptoRequests, commissions] = await Promise.all([
        Promise.all(
          employees.map(async (employee) => ({
            employee,
            timeEntries: await fetchTimeEntries(employee.id),
          }))
        ),
        fetchCompanyPtoRequests(companyId),
        fetchCompanyCommissions(companyId, selectedPeriod.startText, selectedPeriod.endText),
      ]);

      const ptoEntries = buildPtoEntries(ptoRequests);

      const rows = employeeTimeResults.map(({ employee, timeEntries }) => {
        const employeePtoEntries = ptoEntries.filter((entry) => {
          const employeeName = getEmployeeName(employee).toLowerCase();
          return (
            Number(entry.employeeId) === Number(employee.id) ||
            (entry.employeeName || "").trim().toLowerCase() === employeeName
          );
        });

        return calculateEmployeePayroll(
          employee,
          timeEntries,
          employeePtoEntries,
          commissions,
          selectedPeriod
        );
      });

      setPayrollRows(rows);
      setLoaded(true);
    } catch (err) {
      setError(err.message || "Failed to load payroll");
      setPayrollRows([]);
      setLoaded(false);
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodChange(e) {
    setSelectedPeriodValue(e.target.value);
    setLoaded(false);
    setPayrollRows([]);
    setError("");
    setExportMessage("");
  }

  function escapeCsvValue(value) {
    const text = String(value ?? "");
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function handleExportCsv() {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Employee Email",
      "Pay Type",
      "Status",
      "Regular Hours",
      "Overtime Hours",
      "PTO Hours",
      "Hourly Rate",
      "Salary Rate",
      "1099 Rate",
      "Commission Entries",
      "Base Pay",
      "Commission Pay",
      "Gross Pay",
      "Pay Period Start",
      "Pay Period End",
    ];

    const csvRows = [
      headers,
      ...payrollRows.map((row) => [
        row.employeeId,
        row.employeeName,
        row.employeeEmail,
        row.payType,
        row.status,
        formatHours(row.regularHours),
        formatHours(row.overtimeHours),
        formatHours(row.ptoHours),
        row.hourlyRate,
        row.salaryRate,
        row.contractRate,
        row.commissionCount,
        formatMoney(row.basePay),
        formatMoney(row.commissionPay),
        formatMoney(row.grossPay),
        formatDisplayDate(selectedPeriod.start),
        formatDisplayDate(selectedPeriod.end),
      ]),
    ].map((row) => row.map(escapeCsvValue).join(","));

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${selectedPeriod.startText}-to-${selectedPeriod.endText}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMessage("Payroll CSV exported successfully.");
  }

  function handleExportPdf() {
    const blob = new Blob([buildPayrollPdf(payrollRows, summary, selectedPeriod)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${selectedPeriod.startText}-to-${selectedPeriod.endText}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportMessage("Payroll PDF exported successfully.");
  }

  return (
    <div className="modern-settings-page payroll-panel">
      <div className="modern-settings-hero">
        <div>
          <h1>Payroll</h1>
          <p>Review company payroll totals for the selected pay period.</p>
        </div>
        <div className="payroll-actions">
          <label>
            Pay Period
            <select value={selectedPeriodValue} onChange={handlePeriodChange}>
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="modern-save-btn payroll-load-btn"
            onClick={handleLoadPayroll}
            disabled={loading || employees.length === 0}
          >
            {loading ? "Loading Payroll..." : "Load Payroll"}
          </button>

          {loaded && payrollRows.length > 0 && <>
            <button type="button" className="modern-save-btn payroll-export-btn" onClick={handleExportCsv}>Export CSV</button>
            <button type="button" className="modern-save-btn payroll-export-btn" onClick={handleExportPdf}>Export PDF</button>
          </>}
        </div>
      </div>

      <div className="modern-card">
        <div className="modern-card-header payroll-panel-header">
          <div className="modern-icon green">$</div>
          <div>
            <h2>Company Payroll Summary</h2>
            <p>
              Pay period: {formatDisplayDate(selectedPeriod.start)} to{" "}
              {formatDisplayDate(selectedPeriod.end)}
            </p>
            <p className="payroll-commission-note">Commission is filtered by date earned within this pay period.</p>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {exportMessage && <p className="success-message">{exportMessage}</p>}

        <div className="payroll-summary-grid">
          <div>
            <span>Total Employees Included</span>
            <strong>{summary.totalEmployees}</strong>
          </div>
          <div>
            <span>Total Regular Hours</span>
            <strong>{formatHours(summary.regularHours)}</strong>
          </div>
          <div>
            <span>Total Overtime Hours</span>
            <strong>{formatHours(summary.overtimeHours)}</strong>
          </div>
          <div>
            <span>Total PTO Hours</span>
            <strong>{formatHours(summary.ptoHours)}</strong>
          </div>
          <div>
            <span>Total Commission Pay</span>
            <strong>{formatMoney(summary.commissionPay)}</strong>
          </div>
          <div className="payroll-summary-total">
            <span>Total Gross Pay</span>
            <strong>{formatMoney(summary.grossPay)}</strong>
          </div>
        </div>
      </div>

      <div className="modern-card">
        <div className="modern-card-header">
          <div className="modern-icon blue">CSV</div>
          <div>
            <h2>Payroll Export Table</h2>
            <p>Structured for future CSV export to payroll providers.</p>
          </div>
        </div>

        {!loaded && !loading && (
          <div className="payroll-empty-state">
            Click Load Payroll to calculate employee payroll for this pay period.
          </div>
        )}

        {loaded && payrollRows.length === 0 && (
          <div className="payroll-empty-state">
            No employees were found for this company.
          </div>
        )}

        {payrollRows.length > 0 && (
          <div className="payroll-table-wrap">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Employee Email</th>
                  <th>Pay Type</th>
                  <th>Status</th>
                  <th>Regular Hours</th>
                  <th>Overtime Hours</th>
                  <th>PTO Hours</th>
                  <th>Hourly Rate</th>
                  <th>Salary Rate</th>
                  <th>1099 Rate</th>
                  <th>Commission Entries</th>
                  <th>Base Pay</th>
                  <th>Commission Pay</th>
                  <th>Gross Pay</th>
                  <th>Pay Period Start</th>
                  <th>Pay Period End</th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map((row) => (
                  <tr key={row.employeeId}>
                    <td>{row.employeeId}</td>
                    <td>{row.employeeName}</td>
                    <td>{row.employeeEmail}</td>
                    <td>{row.payType}</td>
                    <td>
                      <span className={`payroll-status-label${row.status === "Profit Needed" ? " payroll-status-label--warning" : ""}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{formatHours(row.regularHours)}</td>
                    <td>{formatHours(row.overtimeHours)}</td>
                    <td>{formatHours(row.ptoHours)}</td>
                    <td>{row.hourlyRate}</td>
                    <td>{row.salaryRate}</td>
                    <td>{row.contractRate}</td>
                    <td>{row.commissionCount}</td>
                    <td>{formatMoney(row.basePay)}</td>
                    <td>{formatMoney(row.commissionPay)}</td>
                    <td>{formatMoney(row.grossPay)}</td>
                    <td>{formatDisplayDate(selectedPeriod.start)}</td>
                    <td>{formatDisplayDate(selectedPeriod.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
