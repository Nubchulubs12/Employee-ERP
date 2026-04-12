const BASE_URL = 'https://employee-erps.onrender.com/api/employees';
const TIME_URL = 'https://employee-erps.onrender.com/api/time/employees';

export async function fetchEmployees(companyId) {
  const response = await fetch(`${BASE_URL}/company/${companyId}`);
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error('Failed to load employees');
  }

  return data;
}

export async function createEmployee(employee) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data || 'Failed to create employee');
  }

  return data;
}

export async function updateEmployee(id, employeeData) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to update employee");
  }

  return data;
}

export async function changeEmployeePassword(id, passwordData) {
  const response = await fetch(`${BASE_URL}/${id}/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(passwordData),
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : text;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data || "Failed to change password");
  }

  return data;
}

export async function clockIn(employeeId) {
  const response = await fetch(`${TIME_URL}/${employeeId}/clock-in`, {
    method: "POST",
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to clock in");
  }

  return data;
}

export async function clockOut(employeeId) {
  const response = await fetch(`${TIME_URL}/${employeeId}/clock-out`, {
    method: "POST",
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to clock out");
  }

  return data;
}

export async function fetchTimeEntries(employeeId) {
  const response = await fetch(`${TIME_URL}/${employeeId}`);

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = [];
  }

  if (!response.ok) {
    throw new Error("Failed to load time entries");
  }

  return data;
}

export async function deleteEmployee(id) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
}