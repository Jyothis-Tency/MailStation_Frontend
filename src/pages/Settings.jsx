import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEmailAccounts,
  createEmailAccount,
  deleteEmailAccount,
  updateProfile,
} from "../api";
import Modal from "../components/Modal";
import AppPasswordHint from "../components/AppPasswordHint";
import {
  emptyProfile,
  profileFromUser,
  USER_PLACEHOLDER_DEFS,
} from "../utils/templateUtils";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [profile, setProfile] = useState(emptyProfile());
  const [emailForm, setEmailForm] = useState({
    label: "Primary",
    email: "",
    appPassword: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const primaryEmail = user?.primaryEmail || user?.email;
  const primaryAccount = accounts.find(
    (a) => a.email?.toLowerCase() === primaryEmail?.toLowerCase()
  );

  const loadAccounts = async () => {
    setAccounts(await getEmailAccounts());
  };

  useEffect(() => {
    loadAccounts().catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (user) {
      const p = profileFromUser(user);
      setProfile({
        regardsName: p.regardsName || "",
        phone: p.phone || "",
        linkedinUrl: p.linkedinUrl || "",
        githubUrl: p.githubUrl || "",
        websiteUrl: p.websiteUrl || "",
        jobTitle: p.jobTitle || "",
        location: p.location || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (primaryEmail && !primaryAccount) {
      setEmailForm((f) => ({ ...f, email: primaryEmail, label: "Primary" }));
    }
  }, [primaryEmail, primaryAccount]);

  const openProfileModal = () => {
    setError("");
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setError("");
  };

  const openEmailModal = () => {
    setError("");
    const addingPrimary = !primaryAccount;
    setEmailForm({
      label: addingPrimary ? "Primary" : "",
      email: addingPrimary ? primaryEmail : "",
      appPassword: "",
    });
    setEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setProfileLoading(true);
    try {
      await updateProfile({
        ...profile,
        regardsName: profile.regardsName.trim(),
      });
      setStatus("Profile saved — use placeholders in Templates");
      await refreshUser();
      closeProfileModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);
    try {
      const isPrimary =
        emailForm.email.toLowerCase() === primaryEmail?.toLowerCase();
      await createEmailAccount({
        ...emailForm,
        label: isPrimary ? emailForm.label || "Primary" : emailForm.label,
      });
      setStatus(
        isPrimary ? "Primary sending email saved" : "Email account added"
      );
      await loadAccounts();
      await refreshUser();
      closeEmailModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, label, email) => {
    if (email.toLowerCase() === primaryEmail?.toLowerCase()) {
      setError(
        "Cannot remove your account email. Update the app password instead."
      );
      return;
    }
    if (!confirm(`Remove "${label}"?`)) return;
    try {
      await deleteEmailAccount(id);
      setStatus("Email account removed");
      await loadAccounts();
      await refreshUser();
    } catch (err) {
      setError(err.message);
    }
  };

  const addingPrimary = !primaryAccount;
  const p = profileFromUser(user);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Your profile & sending</h2>
          <p className="muted small">
            Fill in your details once — reuse them in every email template.
          </p>
        </div>
      </header>

      {error && !profileModalOpen && !emailModalOpen && (
        <p className="err banner">{error}</p>
      )}
      {status && <p className="ok banner">{status}</p>}

      <div className="card">
        <div className="list-header">
          <h3>Your details (for templates)</h3>
          <button type="button" className="btn-sm" onClick={openProfileModal}>
            Edit profile
          </button>
        </div>
        <p className="muted small">
          These map to placeholders like <code>{"{{regardsName}}"}</code>,{" "}
          <code>{"{{linkedin}}"}</code>, etc.
        </p>
        <dl className="profile-summary">
          <dt>Name</dt>
          <dd>{p.regardsName || "—"}</dd>
          <dt>Job title</dt>
          <dd>{p.jobTitle || "—"}</dd>
          <dt>Phone</dt>
          <dd>{p.phone || "—"}</dd>
          <dt>Location</dt>
          <dd>{p.location || "—"}</dd>
          <dt>LinkedIn</dt>
          <dd>{p.linkedinUrl || "—"}</dd>
          <dt>GitHub</dt>
          <dd>{p.githubUrl || "—"}</dd>
          <dt>Website</dt>
          <dd>{p.websiteUrl || "—"}</dd>
        </dl>
        <p className="muted small">
          Your login email <strong>{user?.email}</strong> is available as{" "}
          <code>{"{{myEmail}}"}</code> in templates.
        </p>

        <div className="placeholder-ref">
          <p className="label-text">Your placeholders</p>
          <div className="placeholder-ref-grid">
            {USER_PLACEHOLDER_DEFS.map((pDef) => (
              <span key={pDef.key} className="placeholder-ref-item">
                <code>{`{{${pDef.key}}}`}</code>
                <span className="muted small">{pDef.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="list-header">
          <h3>Sending emails</h3>
          <button type="button" className="btn-sm" onClick={openEmailModal}>
            {addingPrimary ? "Set up primary email" : "+ Add email"}
          </button>
        </div>
        <p>
          Primary:{" "}
          <strong className={user?.primaryEmailConfigured ? "ok" : "err"}>
            {user?.primaryEmailConfigured
              ? `${primaryEmail} — ready`
              : `${primaryEmail} — add app password`}
          </strong>
        </p>

        {accounts.length > 0 ? (
          <div className="account-list">
            {accounts.map((acc) => {
              const isPrimary =
                acc.email?.toLowerCase() === primaryEmail?.toLowerCase();
              return (
                <div className="list-item" key={acc._id || acc.id}>
                  <div>
                    <strong>{acc.label}</strong>
                    {isPrimary && (
                      <span className="pill new">account email</span>
                    )}
                    <p className="muted small">{acc.email}</p>
                  </div>
                  {!isPrimary && (
                    <button
                      type="button"
                      className="btn-sm danger"
                      onClick={() =>
                        handleDelete(acc._id || acc.id, acc.label, acc.email)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">No sending emails configured yet.</p>
        )}
      </div>

      <Modal
        open={profileModalOpen}
        onClose={closeProfileModal}
        title="Edit profile"
        wide
      >
        <form onSubmit={handleSaveProfile} className="form">
          <div className="profile-grid">
            <label>
              Your name *
              <input
                value={profile.regardsName}
                onChange={(e) =>
                  setProfile({ ...profile, regardsName: e.target.value })
                }
                placeholder="Full name for sign-off"
                required
              />
            </label>
            <label>
              Job title
              <input
                value={profile.jobTitle}
                onChange={(e) =>
                  setProfile({ ...profile, jobTitle: e.target.value })
                }
                placeholder="e.g. Flutter Developer"
              />
            </label>
            <label>
              Phone
              <input
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="e.g. +91 98765 43210"
              />
            </label>
            <label>
              Location
              <input
                value={profile.location}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
                placeholder="City, Country"
              />
            </label>
            <label className="span-2">
              LinkedIn URL
              <input
                type="url"
                value={profile.linkedinUrl}
                onChange={(e) =>
                  setProfile({ ...profile, linkedinUrl: e.target.value })
                }
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </label>
            <label className="span-2">
              GitHub URL
              <input
                type="url"
                value={profile.githubUrl}
                onChange={(e) =>
                  setProfile({ ...profile, githubUrl: e.target.value })
                }
                placeholder="https://github.com/yourname"
              />
            </label>
            <label className="span-2">
              Website / portfolio
              <input
                type="url"
                value={profile.websiteUrl}
                onChange={(e) =>
                  setProfile({ ...profile, websiteUrl: e.target.value })
                }
                placeholder="https://yourportfolio.com"
              />
            </label>
          </div>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeProfileModal}>
              Cancel
            </button>
            <button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={emailModalOpen}
        onClose={closeEmailModal}
        title={addingPrimary ? "Set up primary email" : "Add sending email"}
      >
        <form onSubmit={handleAddEmail} className="form">
          <label>
            Label
            <input
              value={emailForm.label}
              onChange={(e) =>
                setEmailForm({ ...emailForm, label: e.target.value })
              }
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) =>
                setEmailForm({ ...emailForm, email: e.target.value })
              }
              required
              readOnly={addingPrimary}
              className={addingPrimary ? "readonly" : ""}
            />
          </label>
          <label>
            App password
            <input
              type="password"
              value={emailForm.appPassword}
              onChange={(e) =>
                setEmailForm({ ...emailForm, appPassword: e.target.value })
              }
              required
              autoComplete="new-password"
            />
            <AppPasswordHint />
          </label>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeEmailModal}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving…" : addingPrimary ? "Save primary email" : "Add"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
