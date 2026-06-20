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
