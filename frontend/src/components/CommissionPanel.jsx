import { useEffect, useMemo, useState } from "react";
import {
  createCommission,
  deleteCommission,
  fetchCompanyCommissions,
  updateCommission,
} from "../api/commissionApi";

const emptyForm = {
  employeeId: "",
  description: "",
  amount: "",
  dateEarned: "",
  notes: "",
};

function employeeName(employee) {
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function displayDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CommissionPanel({ companyId, employees = [] }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetchCompanyCommissions(companyId)
      .then((data) => active && setEntries(data || []))
      .catch((err) => active && setError(err.message || "Failed to load commission entries"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [companyId]);

  const total = useMemo(
    () => entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    [entries]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setForm({
      employeeId: String(entry.employeeId),
      description: entry.description || "",
      amount: entry.amount ?? "",
      dateEarned: entry.dateEarned || "",
      notes: entry.notes || "",
    });
    setError("");
    setMessage("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = { ...form, employeeId: Number(form.employeeId), amount: Number(form.amount) };
    try {
      const saved = editingId
        ? await updateCommission(companyId, editingId, payload)
        : await createCommission(companyId, payload);
      setEntries((previous) => editingId
        ? previous.map((entry) => entry.id === saved.id ? saved : entry)
            .sort((a, b) => b.dateEarned.localeCompare(a.dateEarned) || b.id - a.id)
        : [saved, ...previous].sort((a, b) => b.dateEarned.localeCompare(a.dateEarned) || b.id - a.id));
      setMessage(editingId ? "Commission entry updated." : "Commission entry created.");
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save commission entry");
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry) {
    if (!window.confirm(`Delete the ${money(entry.amount)} commission for ${entry.employeeName}?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteCommission(companyId, entry.id);
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      if (editingId === entry.id) resetForm();
      setMessage("Commission entry deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete commission entry");
    }
  }

  return (
    <div className="modern-settings-page commission-panel">
      <div className="modern-settings-hero">
        <div>
          <h1>Commissions</h1>
          <p>Add dated employee commissions. Payroll includes them automatically in the matching pay period.</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="modern-card">
        <div className="modern-card-header">
          <div className="modern-icon green">$</div>
          <div>
            <h2>{editingId ? "Edit Commission" : "Add Commission"}</h2>
            <p>The date earned determines the payroll period; no period selection is needed.</p>
          </div>
        </div>
        <form onSubmit={submit} className="modern-dashboard-form commission-form">
          <label>
            Employee
            <select name="employeeId" value={form.employeeId} onChange={updateField} required>
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>
              ))}
            </select>
          </label>
          <label>
            Date Earned
            <input type="date" name="dateEarned" value={form.dateEarned} onChange={updateField} required />
          </label>
          <label>
            Description
            <input name="description" value={form.description} onChange={updateField} maxLength={255} required />
          </label>
          <label>
            Commission Amount
            <input type="number" name="amount" value={form.amount} onChange={updateField} min="0.01" step="0.01" required />
          </label>
          <label className="full-width-field">
            Notes (optional)
            <textarea name="notes" value={form.notes} onChange={updateField} maxLength={2000} rows={3} />
          </label>
          <div className="form-actions">
            <button type="submit" className="modern-save-btn" disabled={saving || employees.length === 0}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Commission"}
            </button>
            {editingId && <button type="button" className="modern-save-btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="modern-card">
        <div className="modern-card-header">
          <div className="modern-icon blue">List</div>
          <div>
            <h2>Commission Entries</h2>
            <p>{entries.length} entries · {money(total)} total</p>
          </div>
        </div>
        {loading ? <p>Loading commission entries...</p> : entries.length === 0 ? (
          <div className="payroll-empty-state">No commission entries have been added.</div>
        ) : (
          <div className="payroll-table-wrap">
            <table className="payroll-table commission-table">
              <thead><tr><th>Date Earned</th><th>Employee</th><th>Description</th><th>Notes</th><th>Amount</th><th>Actions</th></tr></thead>
              <tbody>{entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{displayDate(entry.dateEarned)}</td>
                  <td>{entry.employeeName}</td>
                  <td>{entry.description}</td>
                  <td>{entry.notes || "—"}</td>
                  <td>{money(entry.amount)}</td>
                  <td className="commission-actions">
                    <button
                      type="button"
                      className="modern-save-btn"
                      onClick={() => startEdit(entry)}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(entry)}>Delete</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
