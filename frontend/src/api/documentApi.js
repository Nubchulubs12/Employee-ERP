const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/documents`;

export async function fetchDocuments(companyId) {
  const response = await fetch(`${BASE_URL}/company/${companyId}`);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = [];
  }
  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to load documents");
  }
  return data;
}

export async function uploadDocument(companyId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/company/${companyId}`, {
    method: "POST",
    body: formData,

  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(data?.message || data || "Failed to upload document");
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