import { useEffect, useState } from "react";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../api";
import TemplateEditor from "../components/TemplateEditor";
import { useAuth } from "../context/AuthContext";
import { renderTemplate, buildPreviewData, profileFromUser } from "../utils/templateUtils";

export default function Templates() {
  const { user } = useAuth();
  const previewData = buildPreviewData(profileFromUser(user));
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setTemplates(await getTemplates());
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const handleSave = async (payload) => {
    setError("");
    setStatus("");
    try {
      if (editing) {
        await updateTemplate(editing._id, payload);
        setStatus("Template updated");
      } else {
        await createTemplate(payload);
        setStatus("Template created");
      }
      setEditing(null);
      setDuplicating(null);
      setShowEditor(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const editorInitial = duplicating
    ? {
        ...duplicating,
        name: `${duplicating.name} (copy)`,
        isDefault: false,
      }
    : editing;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Templates</p>
          <h2>Email templates</h2>
          <p className="muted small">
            Write in plain English — use buttons to insert names and company
            details. Preview updates as you type.
          </p>
        </div>
        <div className="header-actions">
          {status && <span className="ok">{status}</span>}
          {!showEditor && (
            <button type="button" onClick={() => {
              setEditing(null);
              setDuplicating(null);
              setShowEditor(true);
            }}>
              + New template
            </button>
          )}
        </div>
      </header>

      {error && <p className="err banner">{error}</p>}

      {showEditor ? (
        <div className="card template-editor-card">
          <TemplateEditor
            key={editing?._id || duplicating?._id || "new"}
            initial={editorInitial}
            onSave={handleSave}
            onCancel={() => {
              setShowEditor(false);
              setEditing(null);
              setDuplicating(null);
            }}
          />
        </div>
      ) : (
        <section className="card">
          <h3>Saved templates ({templates.length})</h3>
          {templates.length === 0 ? (
            <p className="muted">
              No templates yet. Click <strong>New template</strong> to create
              one with live preview and starter layouts.
            </p>
          ) : (
          <div className="card-scroll">
          {templates.map((t) => (
            <div className="list-item template-list-item" key={t._id}>
              <div className="template-list-body">
                <div className="template-list-title">
                  <strong>{t.name}</strong>
                  {t.isDefault && <span className="pill new">default</span>}
                </div>
                <p className="muted small preview-line">
                  <span className="preview-label">Subject:</span>{" "}
                  {renderTemplate(t.subject, previewData)}
                </p>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => {
                    setEditing(t);
                    setDuplicating(null);
                    setShowEditor(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => {
                    setEditing(null);
                    setDuplicating(t);
                    setShowEditor(true);
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="btn-sm danger"
                  onClick={async () => {
                    if (!confirm("Delete template?")) return;
                    await deleteTemplate(t._id);
                    await load();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          </div>
          )}
        </section>
      )}
    </div>
  );
}
