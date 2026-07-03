import { useEffect, useMemo, useState } from "react";
import {
  createCompanyMonthlyJob,
  deleteCompanyMonthlyJob,
  fetchCompanyMonthlyJobs,
  fetchCompanyMonthlyProfits,
  updateCompanyMonthlyJob,
  updateCompanyMonthlyProfit,
} from "../api/companyApi";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export default function CompanyPayStub({ companyId, employees = [] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [monthlyProfits, setMonthlyProfits] = useState({});
  const [monthlyJobs, setMonthlyJobs] = useState({});
  const [profitDrafts, setProfitDrafts] = useState({});
  const [jobDrafts, setJobDrafts] = useState({});
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({ jobName: "", amount: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const commissionEmployees = useMemo(
    () => employees.filter(
      (employee) => employee.payType === "CONTRACT_1099"
        && Number(employee.commissionPercentage || 0) > 0
    ),
    [employees]
  );

  const savedProfit = monthlyProfits[selectedMonth];
  const hasSavedProfit = Object.prototype.hasOwnProperty.call(monthlyProfits, selectedMonth);
  const selectedJobs = monthlyJobs[selectedMonth] || [];
  const monthlyJobBonus = selectedJobs.reduce(
    (sum, job) => sum + Number(job.amount || 0),
    0
  );
  const monthlyBalance = Number(savedProfit?.grossProfit || 0) + monthlyJobBonus;
  const hasMonthlyData = hasSavedProfit || selectedJobs.length > 0;
  const grossProfitInput = profitDrafts[selectedMonth] ?? savedProfit?.grossProfit ?? "";
  const commissionRows = useMemo(() => {
    return commissionEmployees.map((employee) => ({
      id: employee.id,
      name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
      percentage: Number(employee.commissionPercentage || 0),
      amount: monthlyBalance * Number(employee.commissionPercentage || 0) / 100,
    }));
  }, [commissionEmployees, monthlyBalance]);

  const totalCommission = commissionRows.reduce((sum, row) => sum + row.amount, 0);
  const remainingBalance = monthlyBalance - totalCommission;

  useEffect(() => {
    let cancelled = false;

    async function loadYear() {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const [records, jobs] = await Promise.all([
          fetchCompanyMonthlyProfits(companyId, year),
          fetchCompanyMonthlyJobs(companyId, year),
        ]);
        if (!cancelled) {
          const byMonth = Object.fromEntries(records.map((record) => [record.month, record]));
          const jobsByMonth = jobs.reduce((grouped, job) => ({
            ...grouped,
            [job.month]: [...(grouped[job.month] || []), job],
          }), {});
          setMonthlyProfits(byMonth);
          setMonthlyJobs(jobsByMonth);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load monthly profits");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadYear();
    return () => {
      cancelled = true;
    };
  }, [companyId, year]);

  async function handleUpdate(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedGrossProfit = Number(grossProfitInput);
    if (
      grossProfitInput === ""
      || !Number.isFinite(normalizedGrossProfit)
      || normalizedGrossProfit < 0
    ) {
      setError("Enter a gross profit of zero or more.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCompanyMonthlyProfit(
        companyId,
        year,
        selectedMonth,
        normalizedGrossProfit
      );
      setMonthlyProfits((previous) => ({ ...previous, [selectedMonth]: updated }));
      setProfitDrafts((previous) => ({ ...previous, [selectedMonth]: updated.grossProfit }));
      setMessage(`${MONTHS[selectedMonth - 1]} ${year} balance updated.`);
    } catch (err) {
      setError(err.message || "Failed to update monthly profit");
    } finally {
      setSaving(false);
    }
  }

  function changeYear(nextYear) {
    setYear(nextYear);
    setProfitDrafts({});
    setJobDrafts({});
    setShowJobForm(false);
    setNewJob({ jobName: "", amount: "" });
  }

  function selectMonth(month) {
    setSelectedMonth(month);
    setShowJobForm(false);
    setNewJob({ jobName: "", amount: "" });
  }

  function validateJob(job) {
    const amount = Number(job.amount);
    if (!job.jobName.trim()) {
      setError("Enter a job name.");
      return null;
    }
    if (job.amount === "" || !Number.isFinite(amount) || amount < 0) {
      setError("Enter a job amount of zero or more.");
      return null;
    }
    return { jobName: job.jobName.trim(), amount };
  }

  async function handleAddJob(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const validatedJob = validateJob(newJob);
    if (!validatedJob) return;

    setSavingJob(true);
    try {
      const created = await createCompanyMonthlyJob(
        companyId,
        year,
        selectedMonth,
        validatedJob
      );
      setMonthlyJobs((previous) => ({
        ...previous,
        [selectedMonth]: [...(previous[selectedMonth] || []), created],
      }));
      setNewJob({ jobName: "", amount: "" });
      setShowJobForm(false);
      setMessage(`${created.jobName} added to ${MONTHS[selectedMonth - 1]} ${year}.`);
    } catch (err) {
      setError(err.message || "Failed to add monthly job");
    } finally {
      setSavingJob(false);
    }
  }

  async function handleUpdateJob(job) {
    setError("");
    setMessage("");
    const draft = jobDrafts[job.id] || job;
    const validatedJob = validateJob(draft);
    if (!validatedJob) return;

    setSavingJob(true);
    try {
      const updated = await updateCompanyMonthlyJob(companyId, job.id, validatedJob);
      setMonthlyJobs((previous) => ({
        ...previous,
        [selectedMonth]: (previous[selectedMonth] || []).map((item) => (
          item.id === updated.id ? updated : item
        )),
      }));
      setJobDrafts((previous) => ({ ...previous, [job.id]: updated }));
      setMessage(`${updated.jobName} updated.`);
    } catch (err) {
      setError(err.message || "Failed to update monthly job");
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDeleteJob(job) {
    if (!window.confirm(`Delete ${job.jobName}?`)) return;

    setError("");
    setMessage("");
    setSavingJob(true);
    try {
      await deleteCompanyMonthlyJob(companyId, job.id);
      setMonthlyJobs((previous) => ({
        ...previous,
        [selectedMonth]: (previous[selectedMonth] || []).filter((item) => item.id !== job.id),
      }));
      setJobDrafts((previous) => {
        const next = { ...previous };
        delete next[job.id];
        return next;
      });
      setMessage(`${job.jobName} deleted.`);
    } catch (err) {
      setError(err.message || "Failed to delete monthly job");
    } finally {
      setSavingJob(false);
    }
  }

  return (
    <div className="modern-settings-page company-pay-stub-page">
      <div className="modern-settings-hero company-profit-hero">
        <div>
          <h1>Monthly Gross Profit (Commission Use)</h1>
          <p>Record monthly gross profit and review commission-adjusted balances.</p>
        </div>
        <div className="company-profit-year-controls" aria-label="Select year">
          <button type="button" onClick={() => changeYear(year - 1)} aria-label="Previous year">←</button>
          <strong>{year}</strong>
          <button type="button" onClick={() => changeYear(year + 1)} aria-label="Next year">→</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="modern-card">
        <div className="modern-card-header">
          <div>
            <h2>{year} Monthly Gross Profit</h2>
            <p>Select a month to enter or update its gross profit.</p>
          </div>
        </div>

        <div className="company-profit-month-grid">
          {MONTHS.map((monthName, index) => {
            const monthNumber = index + 1;
            const monthJobs = monthlyJobs[monthNumber] || [];
            const jobBonus = monthJobs.reduce((sum, job) => sum + Number(job.amount || 0), 0);
            const hasBalance = Boolean(monthlyProfits[monthNumber]) || monthJobs.length > 0;
            const balance = Number(monthlyProfits[monthNumber]?.grossProfit || 0) + jobBonus;
            return (
              <button
                type="button"
                key={monthName}
                className={`employee-avatar company-profit-month${selectedMonth === monthNumber ? " company-profit-month--active" : ""}`}
                onClick={() => selectMonth(monthNumber)}
              >
                <span>{monthName}</span>
                <small>{hasBalance ? `Balance: ${formatCurrency(balance)}` : "Not entered"}</small>
                <small>Bonus: {formatCurrency(jobBonus)}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="modern-card company-profit-editor">
        <div className="modern-card-header">
          <div>
            <h2>{MONTHS[selectedMonth - 1]} {year}</h2>
            <p>Enter the company gross profit for this month.</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="company-profit-form">
          <label>
            Company Month Gross Profit ($)
            <input
              type="number"
              min="0"
              step="0.01"
              value={grossProfitInput}
              onChange={(event) => setProfitDrafts((previous) => ({
                ...previous,
                [selectedMonth]: event.target.value,
              }))}
              placeholder="0.00"
              disabled={loading || saving}
            />
          </label>
          <button type="submit" className="modern-save-btn" disabled={loading || saving}>
            {saving ? "Updating..." : "Update"}
          </button>
        </form>

        <section className="company-job-section">
          <div className="company-job-header">
            <div>
              <h2>Job Based</h2>
              <p>Add job amounts to this month’s balance and commission calculation.</p>
            </div>
            <button
              type="button"
              className="modern-save-btn company-job-add-btn"
              onClick={() => setShowJobForm((visible) => !visible)}
            >
              {showJobForm ? "Cancel" : "+ Add Job"}
            </button>
          </div>

          {showJobForm && (
            <form className="company-job-form" onSubmit={handleAddJob}>
              <label>
                Job Name
                <input
                  type="text"
                  value={newJob.jobName}
                  onChange={(event) => setNewJob((previous) => ({
                    ...previous,
                    jobName: event.target.value,
                  }))}
                  placeholder="Enter job name"
                  disabled={savingJob}
                />
              </label>
              <label>
                Job Amount ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newJob.amount}
                  onChange={(event) => setNewJob((previous) => ({
                    ...previous,
                    amount: event.target.value,
                  }))}
                  placeholder="0.00"
                  disabled={savingJob}
                />
              </label>
              <button type="submit" className="modern-save-btn" disabled={savingJob}>
                {savingJob ? "Adding..." : "Add Job"}
              </button>
            </form>
          )}

          {selectedJobs.length === 0 && !showJobForm && (
            <p className="company-job-empty">No job-based amounts added for this month.</p>
          )}

          {selectedJobs.length > 0 && (
            <div className="company-job-list">
              {selectedJobs.map((job) => {
                const draft = jobDrafts[job.id] || job;
                return (
                  <div className="company-job-row" key={job.id}>
                    <input
                      type="text"
                      aria-label={`Job name for ${job.jobName}`}
                      value={draft.jobName}
                      onChange={(event) => setJobDrafts((previous) => ({
                        ...previous,
                        [job.id]: { ...draft, jobName: event.target.value },
                      }))}
                      disabled={savingJob}
                    />
                    <input
                      type="number"
                      aria-label={`Job amount for ${job.jobName}`}
                      min="0"
                      step="0.01"
                      value={draft.amount}
                      onChange={(event) => setJobDrafts((previous) => ({
                        ...previous,
                        [job.id]: { ...draft, amount: event.target.value },
                      }))}
                      disabled={savingJob}
                    />
                    <div className="company-job-actions">
                      <button
                        type="button"
                        className="modern-save-btn"
                        onClick={() => handleUpdateJob(job)}
                        disabled={savingJob}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="company-job-delete-btn"
                        onClick={() => handleDeleteJob(job)}
                        disabled={savingJob}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="company-job-total">
                <span>Monthly Job Bonus</span>
                <strong>{formatCurrency(monthlyJobBonus)}</strong>
              </div>
            </div>
          )}
        </section>

        {hasMonthlyData && (
          <div className="company-profit-summary">
            <div>
              <span>Monthly Gross Profit</span>
              <strong>{formatCurrency(savedProfit?.grossProfit)}</strong>
            </div>
            <div>
              <span>Monthly Job Bonus</span>
              <strong>{formatCurrency(monthlyJobBonus)}</strong>
            </div>
            <div>
              <span>Monthly Balance</span>
              <strong>{formatCurrency(monthlyBalance)}</strong>
            </div>

            {commissionEmployees.length > 0 && (
              <>
                <div>
                  <span>Employee Commissions</span>
                  <strong>-{formatCurrency(totalCommission)}</strong>
                </div>
                <div className="company-profit-remaining">
                  <span>Amount Left After Commissions</span>
                  <strong>{formatCurrency(remainingBalance)}</strong>
                </div>

                <div className="company-commission-breakdown">
                  <h3>Commission Breakdown</h3>
                  {commissionRows.map((row) => (
                    <div key={row.id}>
                      <span>{row.name} ({row.percentage}%)</span>
                      <strong>{formatCurrency(row.amount)}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}

            {commissionEmployees.length === 0 && (
              <p className="company-profit-no-commission">
                No 1099 employees with a commission percentage are assigned to this company.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
