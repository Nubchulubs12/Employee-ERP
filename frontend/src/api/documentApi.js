const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/documents`;

function parseResponseBody(text, fallback) {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return text || fallback;
  }
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.status && data.path) return `${data.status} error loading ${data.path}`;
  return fallback;
}

export async function fetchDocuments(companyId) {
  const response = await fetch(`${BASE_URL}/company/${companyId}`);
  const text = await response.text();
  const data = parseResponseBody(text, []);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to load documents"));
  }
  return data;
}

export async function fetchEmployeeDocuments(employeeId) {
  const response = await fetch(`${BASE_URL}/employee/${employeeId}`);
  const text = await response.text();
  const data = parseResponseBody(text, []);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to load documents"));
  }
  return data;
}

export async function uploadDocument(companyId, file, audience = "ALL") {
  const formData = new FormData();
  formData.append("file", file);

  const encodedAudience = encodeURIComponent(audience);
  const response = await fetch(`${BASE_URL}/company/${companyId}/audience/${encodedAudience}`, {
    method: "POST",
    body: formData,

  });

  const text = await response.text();
  const data = parseResponseBody(text, null);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to upload document"));
  }
  return data;
}

export async function deleteDocument(documentId) {
  const response = await fetch(`${BASE_URL}/${documentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete document");
  }
}


export function getDownloadUrl(documentId) {
  return `${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/download`;
}
