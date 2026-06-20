import { useEffect, useRef, useState } from "react";
import {
  deleteDocument,
  fetchDocuments,
  fetchEmployeeDocuments,
  getDownloadUrl,
  uploadDocument,
} from "../api/documentApi";

const DOCUMENT_AUDIENCES = [
  { value: "ALL", label: "All employees" },
  { value: "W2_EMPLOYEES", label: "Hourly and salary employees" },
  { value: "CONTRACT_1099", label: "1099 employees" },
];

function formatFileSize(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileIcon(fileType) {
  if (!fileType) return "DOC";
  if (fileType.includes("pdf")) return "PDF";
  if (fileType.includes("word") || fileType.includes("document")) return "DOC";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "XLS";
  if (fileType.includes("image")) return "IMG";
  return "DOC";
}

function formatAudience(audience) {
  return DOCUMENT_AUDIENCES.find((option) => option.value === audience)?.label || "All employees";
}

function canEmployeeSeeDocument(doc, employeePayType) {
  const documentAudience = doc.audience || "ALL";
  if (documentAudience === "ALL") return true;

  if (employeePayType === "CONTRACT_1099") {
    return documentAudience === "CONTRACT_1099";
  }

  return documentAudience === "W2_EMPLOYEES";
}

export default function DocumentsPanel({
  companyId,
  employeeId,
  employeePayType,
  canUpload = false,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        let data;

        if (canUpload) {
          data = await fetchDocuments(companyId);
        } else {
          try {
            data = await fetchEmployeeDocuments(employeeId);
          } catch {
            const companyDocuments = await fetchDocuments(companyId);
            data = companyDocuments.filter((doc) => canEmployeeSeeDocument(doc, employeePayType));
          }
        }

        setDocuments(data);
      } catch (err) {
        setError(err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    if ((canUpload && companyId) || (!canUpload && companyId && employeeId)) load();
  }, [canUpload, companyId, employeeId, employeePayType]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const uploaded = await uploadDocument(companyId, file, audience);
      setDocuments((prev) => [{ ...uploaded, audience }, ...prev]);
      setMessage(`"${file.name}" uploaded for ${formatAudience(audience)}.`);
      fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.fileName}"?`)) return;

    setError("");
    setMessage("");

    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setMessage(`"${doc.fileName}" deleted.`);
    } catch (err) {
      setError(err.message || "Failed to delete document");
    }
  }

  function handleDownload(doc) {
    const url = getDownloadUrl(doc.id);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="employee-tab-content">
      <h2>Documents</h2>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {canUpload && (
        <div
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: 10,
            padding: "24px",
            textAlign: "center",
            marginBottom: 24,
            background: "#fafafa",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: "0.95rem" }}>
            Upload a document for your employees to access
          </p>

          <label
            style={{
              display: "block",
              maxWidth: 360,
              margin: "0 auto 14px",
              textAlign: "left",
              color: "#374151",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Who should see this document?
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={uploading}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              {DOCUMENT_AUDIENCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            id="doc-upload"
            style={{ display: "none" }}
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
          />

          <label
            htmlFor="doc-upload"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "#3d52c4",
              color: "#fff",
              borderRadius: 6,
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Choose File"}
          </label>

          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>
            PDF, Word, Excel, images up to 10 MB
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading documents...</p>
      ) : documents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#9ca3af",
            fontSize: "0.95rem",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>Folder</div>
          {canUpload ? "No documents uploaded yet." : "No documents available yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <span
                style={{
                  width: 44,
                  flexShrink: 0,
                  color: "#3d52c4",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {fileIcon(doc.fileType)}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {doc.fileName}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2 }}>
                  {formatFileSize(doc.fileSize)} - Uploaded {formatDate(doc.uploadedAt)}
                  {canUpload && ` - ${formatAudience(doc.audience)}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  style={{
                    padding: "6px 14px",
                    background: "#3d52c4",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  Download
                </button>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    style={{
                      padding: "6px 12px",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
