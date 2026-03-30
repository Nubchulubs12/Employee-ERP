const BASE_URL = 'http://localhost:8080/api/employees';

export async function fetchEmployees() {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    throw new Error('Failed to load employees');
  }

  return response.json();
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
  try{
  data = text ? JSON.parse(text) : null;
}catch{
data = text;
}
  if (!response.ok) {
    throw new Error( data || 'Failed to create employee');
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