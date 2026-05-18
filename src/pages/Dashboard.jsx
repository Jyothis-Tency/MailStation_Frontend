import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getContacts,
  getScheduled,
  getTemplates,
  getResumes,
  getLogs,
} from "../api";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    contacts: 0,
    templates: 0,
    resumes: 0,
    pending: 0,
    sent: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [contacts, templates, resumes, scheduled, logs] =
          await Promise.all([
            getContacts(),
            getTemplates(),
            getResumes(),
            getScheduled(),
            getLogs(),
          ]);

        setStats({
          contacts: contacts.length,
          templates: templates.length,
          resumes: resumes.length,
          pending: scheduled.filter((s) => s.status === "pending").length,
          sent: logs.filter((l) => l.success).length,
        });
      } catch {
        /* ignore */
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Welcome, {user?.name}</h2>
          <p className="muted">
            {user?.primaryEmailConfigured
              ? `Primary sender: ${user.primaryEmail || user.email}`
              : `Set up app password for ${user?.email} in Settings.`}
          </p>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.contacts}</span>
          <span className="stat-label">Contacts</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.templates}</span>
          <span className="stat-label">Templates</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.resumes}</span>
          <span className="stat-label">Resumes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Scheduled</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.sent}</span>
          <span className="stat-label">Emails sent</span>
        </div>
      </div>

      <div className="card-grid">
        <Link to="/contacts" className="quick-card">
          <h3>Manage contacts</h3>
          <p className="muted">Companies & HR details</p>
        </Link>
        <Link to="/schedule" className="quick-card">
          <h3>Schedule emails</h3>
          <p className="muted">Pick date & time</p>
        </Link>
        <Link to="/settings" className="quick-card">
          <h3>Sending emails</h3>
          <p className="muted">Multiple accounts & app passwords</p>
        </Link>
      </div>

      <div className="card hint">
        <p>
          Contact: <code>{"{{hrName}}"}</code>, <code>{"{{companyName}}"}</code>.
          Your profile: <code>{"{{regardsName}}"}</code>, <code>{"{{phone}}"}</code>,{" "}
          <code>{"{{linkedin}}"}</code>, and more — set in Settings.
        </p>
      </div>
    </div>
  );
}
