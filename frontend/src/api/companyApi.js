const BASE_URL = 'http://localhost:8080/api/companies';

export async function fetchCompanies() {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error('Failed to load companies');
  }

  return response.json();
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
    throw new Error(data || 'Registration failed');
  }

  return data;
}