import { useEffect, useState, useRef } from "react";
import { fetchDocuments, uploadDocument, deleteDocument, getDownloadUrl } from "../api/documentApi";

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fileIcon(fileType) {
  if (!fileType) return "📄";
  if (fileType.includes("pdf")) return "📕";
  if (fileType.includes("word") || fileType.includes("document")) return "📘";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📗";
  if (fileType.includes("image")) return "🖼️";
  return "📄";
}


export default function DocumentsPanel({ companyId, canUpload = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchDocuments(companyId);
        setDocuments(data);
      } catch (err) {
        setError(err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }
    if (companyId) load();
  }, [companyId]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(""); setMessage("");
    setUploading(true);
    try {
      const uploaded = await uploadDocument(companyId, file);
      setDocuments((prev) => [uploaded, ...prev]);
      setMessage(`"${file.name}" uploaded successfully.`);
      fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.fileName}"?`)) return;
    setError(""); setMessage("");
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
        <div style={{
          border: "2px dashed #d1d5db", borderRadius: 10,
          padding: "24px", textAlign: "center",
          marginBottom: 24, background: "#fafafa",
        }}>
          <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: "0.95rem" }}>
            Upload a document for your employees to access
          </p>
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
              display: "inline-block", padding: "8px 20px",
              background: "#3d52c4", color: "#fff", borderRadius: 6,
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 600, fontSize: "0.9rem",
              opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? "Uploading..." : "⬆ Choose File"}
          </label>
          <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>
            PDF, Word, Excel, images up to 10 MB
          </p>
        </div>
      )}


      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading documents...</p>
      ) : documents.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 0",
          color: "#9ca3af", fontSize: "0.95rem",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📂</div>
          {canUpload ? "No documents uploaded yet." : "No documents available yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "12px 16px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >

              <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>
                {fileIcon(doc.fileType)}
              </span>


              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.fileName}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2 }}>
                  {formatFileSize(doc.fileSize)} · Uploaded {formatDate(doc.uploadedAt)}
                </div>
              </div>


              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  style={{
                    padding: "6px 14px", background: "#3d52c4", color: "#fff",
                    border: "none", borderRadius: 6, cursor: "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}
                >
                  ⬇ Download
                </button>
                {canUpload && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    style={{
                      padding: "6px 12px", background: "#ef4444", color: "#fff",
                      border: "none", borderRadius: 6, cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 600,
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