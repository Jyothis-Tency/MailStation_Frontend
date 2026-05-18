import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getContacts,
  getTemplates,
  getResumes,
  getScheduled,
  getEmailAccounts,
  createScheduled,
  bulkSchedule,
  cancelScheduled,
  sendEmailNow,
} from "../api";
import Modal from "../components/Modal";

const toLocalInput = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function Schedule() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [form, setForm] = useState({
    emailAccountId: "",
    templateId: "",
    resumeId: "",
    scheduledAt: toLocalInput(new Date(Date.now() + 3600000)),
  });
  const [sendNow, setSendNow] = useState({
    contactId: "",
    emailAccountId: "",
    templateId: "",
    resumeId: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sendNowModalOpen, setSendNowModalOpen] = useState(false);

  const load = async () => {
    const [c, t, r, s, accounts] = await Promise.all([
      getContacts(),
      getTemplates(),
      getResumes(),
      getScheduled(),
      getEmailAccounts(),
    ]);
    setContacts(c);
    setTemplates(t);
    setResumes(r);
    setScheduled(s);
    setEmailAccounts(accounts);
    const defTpl = t.find((x) => x.isDefault) || t[0];
    const accountEmail = user?.primaryEmail || user?.email;
    const defAcc =
      accounts.find(
        (a) => a.email?.toLowerCase() === accountEmail?.toLowerCase()
      ) ||
      accounts.find((x) => x.isDefault) ||
      accounts[0];
    if (defTpl) {
      setForm((f) => ({
        ...f,
        templateId: f.templateId || defTpl._id,
      }));
      setSendNow((f) => ({
        ...f,
        templateId: f.templateId || defTpl._id,
      }));
    }
    if (defAcc) {
      const accId = defAcc._id || defAcc.id;
      setForm((f) => ({
        ...f,
        emailAccountId: f.emailAccountId || accId,
      }));
      setSendNow((f) => ({
        ...f,
        emailAccountId: f.emailAccountId || accId,
      }));
    }
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const toggleContact = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openScheduleModal = () => {
    setError("");
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setError("");
  };

  const openSendNowModal = () => {
    setError("");
    setSendNowModalOpen(true);
  };

  const closeSendNowModal = () => {
    setSendNowModalOpen(false);
    setError("");
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!selectedContacts.length) {
      setError("Select at least one contact");
      return;
    }
    try {
      const payload = {
        contactIds: selectedContacts,
        emailAccountId: form.emailAccountId,
        templateId: form.templateId,
        resumeId: form.resumeId || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };
      if (selectedContacts.length === 1) {
        await createScheduled({
          contactId: selectedContacts[0],
          emailAccountId: form.emailAccountId,
          templateId: form.templateId,
          resumeId: form.resumeId || undefined,
          scheduledAt: payload.scheduledAt,
        });
      } else {
        await bulkSchedule(payload);
      }
      setStatus(`Scheduled ${selectedContacts.length} email(s)`);
      setSelectedContacts([]);
      closeScheduleModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendNow = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await sendEmailNow({
        contactId: sendNow.contactId,
        emailAccountId: sendNow.emailAccountId,
        templateId: sendNow.templateId,
        resumeId: sendNow.resumeId || undefined,
      });
      setStatus("Email sent immediately");
      closeSendNowModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = async (id) => {
    await cancelScheduled(id);
    await load();
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Send & schedule</h2>
        </div>
        <div className="page-actions">
          {status && <span className="ok">{status}</span>}
          <button type="button" onClick={openScheduleModal}>
            Schedule for later
          </button>
          <button type="button" className="btn-sm" onClick={openSendNowModal}>
            Send now
          </button>
        </div>
      </header>

      {error && !scheduleModalOpen && !sendNowModalOpen && (
        <p className="err banner">{error}</p>
      )}

      <section className="card">
        <h3>Scheduled queue</h3>
        {!scheduled.length ? (
          <p className="muted">
            Nothing scheduled yet.{" "}
            <button type="button" className="btn-sm" onClick={openScheduleModal}>
              Schedule an email
            </button>
          </p>
        ) : (
          <div className="table-scroll wide">
            <div className="table">
              <div className="table-head">
                <span>Contact</span>
                <span>From</span>
                <span>Template</span>
                <span>When</span>
                <span>Status</span>
                <span></span>
              </div>
              {scheduled.map((s) => (
                <div className="table-row" key={s._id}>
                  <span>
                    {s.contact?.companyName} — {s.contact?.hrName}
                  </span>
                  <span className="muted small">
                    {s.emailAccount?.email || "—"}
                  </span>
                  <span className="muted">{s.template?.name}</span>
                  <span className="muted">
                    {new Date(s.scheduledAt).toLocaleString()}
                  </span>
                  <span className={`pill ${s.status}`}>{s.status}</span>
                  <span>
                    {s.status === "pending" && (
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => handleCancel(s._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Modal
        open={scheduleModalOpen}
        onClose={closeScheduleModal}
        title="Schedule for later"
        wide
      >
        <form onSubmit={handleSchedule} className="form">
          <div className="contact-pick">
            <p className="label-text">Select contacts</p>
            <div className="check-list">
              {contacts.map((c) => (
                <label key={c._id} className="check-item">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(c._id)}
                    onChange={() => toggleContact(c._id)}
                  />
                  {c.companyName} — {c.hrName}
                </label>
              ))}
            </div>
          </div>
          <label>
            Send from
            <select
              value={form.emailAccountId}
              onChange={(e) =>
                setForm({ ...form, emailAccountId: e.target.value })
              }
              required
            >
              <option value="">Select email account</option>
              {emailAccounts.map((a) => (
                <option key={a._id || a.id} value={a._id || a.id}>
                  {a.label} ({a.email})
                  {a.isDefault ? " — default" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Template
            <select
              value={form.templateId}
              onChange={(e) =>
                setForm({ ...form, templateId: e.target.value })
              }
              required
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resume (optional)
            <select
              value={form.resumeId}
              onChange={(e) =>
                setForm({ ...form, resumeId: e.target.value })
              }
            >
              <option value="">No attachment</option>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date & time
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                setForm({ ...form, scheduledAt: e.target.value })
              }
              required
            />
          </label>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeScheduleModal}>
              Cancel
            </button>
            <button type="submit">Schedule emails</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={sendNowModalOpen}
        onClose={closeSendNowModal}
        title="Send now"
      >
        <form onSubmit={handleSendNow} className="form">
          <label>
            Contact
            <select
              value={sendNow.contactId}
              onChange={(e) =>
                setSendNow({ ...sendNow, contactId: e.target.value })
              }
              required
            >
              <option value="">Select contact</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName} — {c.hrName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Send from
            <select
              value={sendNow.emailAccountId}
              onChange={(e) =>
                setSendNow({ ...sendNow, emailAccountId: e.target.value })
              }
              required
            >
              <option value="">Select email account</option>
              {emailAccounts.map((a) => (
                <option key={a._id || a.id} value={a._id || a.id}>
                  {a.label} ({a.email})
                </option>
              ))}
            </select>
          </label>
          <label>
            Template
            <select
              value={sendNow.templateId}
              onChange={(e) =>
                setSendNow({ ...sendNow, templateId: e.target.value })
              }
              required
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Resume (optional)
            <select
              value={sendNow.resumeId}
              onChange={(e) =>
                setSendNow({ ...sendNow, resumeId: e.target.value })
              }
            >
              <option value="">No attachment</option>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeSendNowModal}>
              Cancel
            </button>
            <button type="submit">Send immediately</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
