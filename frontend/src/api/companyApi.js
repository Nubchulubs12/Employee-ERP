const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies`;

export async function fetchCompanyById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || 'Failed to load company');
  }
  return data;
}

export async function registerCompany(company) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || 'Registration failed');
  }
  return data;
}

export async function updateCompanySettings(id, settings) {
  const response = await fetch(`${BASE_URL}/${id}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to update company settings");
  }
  return data;
}


export async function updateCompanyInfo(id, info) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(info),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to update company info");
  }
  return data;
}

export async function changeCompanyPassword(id, passwordData) {
  const response = await fetch(`${BASE_URL}/${id}/change-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(passwordData),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to change password");
  }
  return data;
}