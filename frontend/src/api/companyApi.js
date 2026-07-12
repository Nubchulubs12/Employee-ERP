const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies`;

function parseErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) {
    return data.path ? `${data.error} at ${data.path}` : data.error;
  }
  if (typeof data.detail === "string" && data.detail) return data.detail;
  return fallback;
}

async function readResponse(response, fallbackMessage) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = parseErrorMessage(
      data,
      `${fallbackMessage} (${response.status} ${response.statusText})`
    );
    throw new Error(message);
  }

  return data;
}

export async function fetchCompanyById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  return readResponse(response, "Failed to load company");
}

export async function registerCompany(company) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company),
  });
  return readResponse(response, "Registration failed");
}

export async function updateCompanySettings(id, settings) {
  const response = await fetch(`${BASE_URL}/${id}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return readResponse(response, "Failed to update company settings");
}

export async function updateCompanyPlan(id, planCode) {
  const response = await fetch(`${BASE_URL}/${id}/plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planCode }),
  });
  return readResponse(response, "Failed to update company plan");
}

export async function startStripeBillingSession(companyId, planCode) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/stripe/billing-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId, planCode }),
  });
  return readResponse(response, "Failed to start Stripe billing");
}

export async function fetchBillingDetails(companyId) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/stripe/companies/${companyId}/billing`);
  return readResponse(response, "Failed to load billing details");
}

export async function fetchStripeInvoices(companyId) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/stripe/companies/${companyId}/invoices`, {
    method: "GET",
  });
  return readResponse(response, "Failed to load Stripe invoices");
}

export async function cancelStripeSubscription(companyId) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const response = await fetch(`${apiBaseUrl}/api/stripe/companies/${companyId}/cancel`, {
    method: "POST",
  });
  return readResponse(response, "Failed to cancel subscription");
}


export async function updateCompanyInfo(id, info) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(info),
  });
  return readResponse(response, "Failed to update company info");
}

export async function changeCompanyPassword(id, passwordData) {
  const response = await fetch(`${BASE_URL}/${id}/change-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passwordData),
  });
  return readResponse(response, "Failed to change password");
}

export async function fetchCompanyMonthlyProfits(id, year) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profits?year=${year}`);
  return readResponse(response, "Failed to load company monthly profits");
}

export async function updateCompanyMonthlyProfit(id, year, month, grossProfit) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profits/${year}/${month}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grossProfit }),
  });
  return readResponse(response, "Failed to update company monthly profit");
}

export async function fetchCompanyMonthlyJobs(id, year) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profit-jobs?year=${year}`);
  return readResponse(response, "Failed to load monthly jobs");
}

export async function createCompanyMonthlyJob(id, year, month, job) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profit-jobs/${year}/${month}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  return readResponse(response, "Failed to add monthly job");
}

export async function updateCompanyMonthlyJob(id, jobId, job) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profit-jobs/${jobId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });
  return readResponse(response, "Failed to update monthly job");
}

export async function deleteCompanyMonthlyJob(id, jobId) {
  const response = await fetch(`${BASE_URL}/${id}/monthly-profit-jobs/${jobId}`, {
    method: "DELETE",
  });
  return readResponse(response, "Failed to delete monthly job");
}
