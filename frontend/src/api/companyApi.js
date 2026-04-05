const BASE_URL = 'http://localhost:8080/api/companies';

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
    headers: {
      'Content-Type': 'application/json',
    },
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