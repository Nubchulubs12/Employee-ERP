//const BASE_URL = 'https://employee-erps.onrender.com/api/employees';
//const TIME_URL = 'https://employee-erps.onrender.com/api/time/employees';
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/employees`;
const TIME_URL = `${import.meta.env.VITE_API_BASE_URL}/api/time/employees`;
const TIME_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/time`;
const PTO_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/pto`;

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

export async function updateTimeEntry(entryId, entryData) {
  const response = await fetch(`${TIME_BASE_URL}/entries/${entryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entryData),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to update time entry");
  }

  return data;
}

export async function deleteTimeEntry(entryId) {
  const response = await fetch(`${TIME_BASE_URL}/entries/${entryId}`, {
    method: "DELETE",
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to delete time entry");
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

export async function createPtoRequest(employeeId, requestData) {
  const response = await fetch(`${PTO_BASE_URL}/employees/${employeeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to create PTO request");
  }

  return data;
}

export async function fetchEmployeePtoRequests(employeeId) {
  const response = await fetch(`${PTO_BASE_URL}/employees/${employeeId}`);

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = [];
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to load PTO requests");
  }

  return data;
}

export async function fetchCompanyPtoRequests(companyId) {
  const response = await fetch(`${PTO_BASE_URL}/company/${companyId}`);

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = [];
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to load company PTO requests");
  }

  return data;
}

export async function approvePtoRequest(requestId, reviewNote = "") {
  const response = await fetch(`${PTO_BASE_URL}/${requestId}/approve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviewNote }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to approve PTO request");
  }

  return data;
}

export async function denyPtoRequest(requestId, reviewNote = "") {
  const response = await fetch(`${PTO_BASE_URL}/${requestId}/deny`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviewNote }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to deny PTO request");
  }

  return data;
}

export async function fetchEmployeeById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to load employee");
  }

  return data;
}