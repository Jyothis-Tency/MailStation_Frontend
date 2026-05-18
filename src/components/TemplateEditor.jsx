import { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPlaceholders,
  buildPreviewData,
  buildStarterTemplates,
  profileFromUser,
  renderTemplate,
  plainTextToHtml,
  htmlToPlain,
} from "../utils/templateUtils";

const emptyForm = {
  name: "",
  subject: "",
  message: "",
  htmlBody: "",
  isDefault: false,
};

export default function TemplateEditor({ initial, onSave, onCancel }) {
  const { user } = useAuth();
  const profile = useMemo(() => profileFromUser(user), [user]);
  const placeholders = useMemo(() => getPlaceholders(profile), [profile]);
  const previewData = useMemo(() => buildPreviewData(profile), [profile]);
  const starterTemplates = useMemo(
    () => buildStarterTemplates(profile),
    [profile]
  );

  const [form, setForm] = useState(() => {
    if (!initial) return { ...emptyForm, message: "" };
    const plain = htmlToPlain(initial.htmlBody);
    return {
      name: initial.name,
      subject: initial.subject,
      message: plain || initial.htmlBody,
      htmlBody: initial.htmlBody,
      isDefault: initial.isDefault,
    };
  });
  const [mode, setMode] = useState("simple");
  const [starterId, setStarterId] = useState("");
  const subjectRef = useRef(null);
  const messageRef = useRef(null);
  const htmlRef = useRef(null);

  const previewSubject = useMemo(
    () => renderTemplate(form.subject, previewData),
    [form.subject, previewData]
  );

  const previewHtml = useMemo(() => {
    const body =
      mode === "simple"
        ? plainTextToHtml(form.message)
        : form.htmlBody;
    return renderTemplate(body, previewData);
  }, [mode, form.message, form.htmlBody, previewData]);

  const insertPlaceholder = (field, key) => {
    const token = `{{${key}}}`;
    const ref =
      field === "subject"
        ? subjectRef
        : mode === "simple"
          ? messageRef
          : htmlRef;
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const value = el.value;
    const next = value.slice(0, start) + token + value.slice(end);

    if (field === "subject") {
      setForm((f) => ({ ...f, subject: next }));
    } else if (mode === "simple") {
      setForm((f) => ({ ...f, message: next }));
    } else {
      setForm((f) => ({ ...f, htmlBody: next }));
    }

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const applyStarter = (id) => {
    const starter = starterTemplates.find((s) => s.id === id);
    if (!starter) return;
    setForm((f) => ({
      ...f,
      name: f.name || starter.name,
      subject: starter.subject,
      message: starter.message,
      htmlBody: plainTextToHtml(starter.message),
    }));
    setMode("simple");
    setStarterId(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const htmlBody =
      mode === "simple" ? plainTextToHtml(form.message) : form.htmlBody.trim();
    onSave({
      name: form.name.trim(),
      subject: form.subject.trim(),
      htmlBody,
      isDefault: form.isDefault,
    });
  };

  return (
    <div className="template-editor">
      <div className="template-editor-main">
        <form onSubmit={handleSubmit} className="form">
          {!initial && (
            <label>
              Start from a template
              <select
                value={starterId}
                onChange={(e) => {
                  setStarterId(e.target.value);
                  if (e.target.value) applyStarter(e.target.value);
                }}
              >
                <option value="">Blank — write your own</option>
                {starterTemplates.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Template name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Flutter developer outreach"
              required
            />
          </label>

          <div className="field-group">
            <label>
              Subject line
              <input
                ref={subjectRef}
                value={form.subject}
                onChange={(e) =>
                  setForm({ ...form, subject: e.target.value })
                }
                placeholder="Interest in {{companyName}}"
                required
              />
            </label>
            <PlaceholderBar
              placeholders={placeholders}
              onInsert={(key) => insertPlaceholder("subject", key)}
            />
          </div>

          <div className="mode-tabs">
            <button
              type="button"
              className={mode === "simple" ? "tab active" : "tab"}
              onClick={() => setMode("simple")}
            >
              Simple editor
            </button>
            <button
              type="button"
              className={mode === "html" ? "tab active" : "tab"}
              onClick={() => {
                if (mode === "simple" && form.message) {
                  setForm((f) => ({
                    ...f,
                    htmlBody: plainTextToHtml(f.message),
                  }));
                }
                setMode("html");
              }}
            >
              HTML (advanced)
            </button>
          </div>

          {mode === "simple" ? (
            <div className="field-group">
              <label>
                Message
                <span className="hint-inline">
                  Write normally — blank lines become paragraphs
                </span>
                <textarea
                  ref={messageRef}
                  rows={12}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder={`Dear {{hrName}},\n\nI am interested in {{companyName}}...\n\nBest regards,\n{{regardsName}}\n{{jobTitle}}\n{{phone}} · {{myEmail}}\nLinkedIn: {{linkedin}}`}
                  required
                />
              </label>
              <PlaceholderBar
                placeholders={placeholders}
                onInsert={(key) => insertPlaceholder("message", key)}
              />
            </div>
          ) : (
            <div className="field-group">
              <label>
                HTML body
                <textarea
                  ref={htmlRef}
                  rows={12}
                  value={form.htmlBody}
                  onChange={(e) =>
                    setForm({ ...form, htmlBody: e.target.value })
                  }
                  required
                />
              </label>
              <PlaceholderBar
                placeholders={placeholders}
                onInsert={(key) => insertPlaceholder("message", key)}
              />
            </div>
          )}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
            />
            Use as default template when scheduling
          </label>

          <div className="btn-row">
            <button type="submit">{initial ? "Update template" : "Save template"}</button>
            {onCancel && (
              <button type="button" className="btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <aside className="template-preview-panel">
        <h3>Live preview</h3>
        <p className="muted small">
          Sample: {previewData.hrName} at {previewData.companyName} · regards:{" "}
          {previewData.regardsName}
        </p>
        <div className="preview-subject">
          <span className="preview-label">Subject</span>
          <p>{previewSubject || "—"}</p>
        </div>
        <div className="preview-body">
          <span className="preview-label">Email</span>
          <div
            className="preview-html"
            dangerouslySetInnerHTML={{
              __html: previewHtml || "<p class='muted'>Start typing to preview…</p>",
            }}
          />
        </div>
        <div className="preview-placeholders card hint">
          <p className="label-text">Available placeholders</p>
          <ul className="placeholder-legend">
            {placeholders.map((p) => (
              <li key={p.key}>
                <code>{`{{${p.key}}}`}</code> → {p.sample}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function PlaceholderBar({ placeholders, onInsert }) {
  const contact = placeholders.filter((p) => p.group === "contact");
  const you = placeholders.filter((p) => p.group === "you");

  return (
    <div className="placeholder-bar-wrap">
      <div className="placeholder-bar">
        <span className="placeholder-bar-label">Contact:</span>
        {contact.map((p) => (
          <PlaceholderChip key={p.key} p={p} onInsert={onInsert} />
        ))}
      </div>
      <div className="placeholder-bar">
        <span className="placeholder-bar-label">You:</span>
        {you.map((p) => (
          <PlaceholderChip key={p.key} p={p} onInsert={onInsert} />
        ))}
      </div>
    </div>
  );
}

function PlaceholderChip({ p, onInsert }) {
  return (
    <button
      type="button"
      className={`placeholder-chip ${p.group === "you" ? "you" : ""}`}
      onClick={() => onInsert(p.key)}
      title={`{{${p.key}}} → ${p.sample}`}
    >
      {p.label}
    </button>
  );
}
