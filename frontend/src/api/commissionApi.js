const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/commissions`;

async function readResponse(response, fallback) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const fieldErrors = Array.isArray(data?.errors)
      ? data.errors.map((error) => error.defaultMessage || error.message).filter(Boolean).join(" ")
      : "";
    const message = typeof data === "string"
      ? data
      : data?.message || data?.detail || fieldErrors || data?.error || data?.title || fallback;
    throw new Error(typeof message === "string" ? message : fallback);
  }
  return data;
}

function periodQuery(startDate, endDate) {
  if (!startDate || !endDate) return "";
  return `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
}

export async function fetchCompanyCommissions(companyId, startDate, endDate) {
  const response = await fetch(`${BASE_URL}/companies/${companyId}${periodQuery(startDate, endDate)}`);
  return readResponse(response, "Failed to load commission entries");
}

export async function fetchEmployeeCommissions(employeeId, startDate, endDate) {
  const response = await fetch(`${BASE_URL}/employees/${employeeId}${periodQuery(startDate, endDate)}`);
  return readResponse(response, "Failed to load employee commissions");
}

export async function createCommission(companyId, entry) {
  const response = await fetch(`${BASE_URL}/companies/${companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return readResponse(response, "Failed to create commission entry");
}

export async function updateCommission(companyId, entryId, entry) {
  const response = await fetch(`${BASE_URL}/companies/${companyId}/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return readResponse(response, "Failed to update commission entry");
}

export async function deleteCommission(companyId, entryId) {
  const response = await fetch(`${BASE_URL}/companies/${companyId}/${entryId}`, {
    method: "DELETE",
  });
  return readResponse(response, "Failed to delete commission entry");
}
