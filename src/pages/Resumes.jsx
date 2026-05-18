import { useEffect, useState } from "react";
import { getResumes, uploadResume, deleteResume } from "../api";
import Modal from "../components/Modal";

const MAX_RESUMES = 2;

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const load = async () => {
    setResumes(await getResumes());
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const atLimit = resumes.length >= MAX_RESUMES;

  const openUploadModal = () => {
    if (atLimit) return;
    setLabel("");
    setFile(null);
    setError("");
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setLabel("");
    setFile(null);
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !label.trim()) {
      setError("Label and PDF file are required");
      return;
    }
    setError("");
    setStatus("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("label", label.trim());
      fd.append("file", file);
      await uploadResume(fd);
      setStatus("Resume uploaded");
      closeUploadModal();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumes</p>
          <h2>Multiple PDF resumes</h2>
          <p className="muted small">
            Up to {MAX_RESUMES} PDFs, 5MB each. Stored in MongoDB (GridFS).
          </p>
        </div>
        <div className="page-actions">
          {status && <span className="ok">{status}</span>}
          <button type="button" onClick={openUploadModal} disabled={atLimit}>
            + Upload resume
          </button>
        </div>
      </header>

      <section className="card">
        <div className="list-header">
          <h3>Your resumes</h3>
          <span className="muted">
            {resumes.length}/{MAX_RESUMES}
          </span>
        </div>
        {resumes.map((r) => (
          <div className="list-item" key={r._id}>
            <div>
              <strong>{r.label}</strong>
              <p className="muted small">
                {r.originalName} · {formatSize(r.sizeBytes)}
              </p>
            </div>
            <button
              type="button"
              className="btn-sm danger"
              onClick={async () => {
                if (!confirm("Delete this resume?")) return;
                await deleteResume(r._id);
                await load();
              }}
            >
              Delete
            </button>
          </div>
        ))}
        {!resumes.length && (
          <p className="muted">
            No resumes uploaded.{" "}
            <button type="button" className="btn-sm" onClick={openUploadModal}>
              Upload your first resume
            </button>
          </p>
        )}
        {atLimit && (
          <p className="muted small">Resume limit reached. Delete one to upload another.</p>
        )}
      </section>

      <Modal
        open={uploadModalOpen}
        onClose={closeUploadModal}
        title="Upload resume"
      >
        <form onSubmit={handleUpload} className="form">
          <label>
            Label (e.g. Flutter dev, Backend)
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </label>
          <label>
            PDF file
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </label>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeUploadModal}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
