import { useEffect, useState } from "react";
import { getLogs } from "../api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h2>Email logs</h2>
        </div>
      </header>

      {error && <p className="err">{error}</p>}

      <section className="card">
        {!logs.length ? (
          <p className="muted">No emails sent yet.</p>
        ) : (
        <div className="table-scroll wide">
          <div className="table">
          <div className="table-head">
            <span>From</span>
            <span>To</span>
            <span>Subject</span>
            <span>Result</span>
            <span>When</span>
          </div>
          {logs.map((log) => (
            <div className="table-row" key={log._id}>
              <span className="muted small">{log.fromEmail || "—"}</span>
              <span className="muted">
                {log.contact?.email || log.to}
              </span>
              <span>{log.subject}</span>
              <span className={log.success ? "ok" : "err"}>
                {log.success ? "Sent" : "Failed"}
              </span>
              <span className="muted">
                {new Date(log.createdAt).toLocaleString()}
              </span>
              {!log.success && log.errorMessage && (
                <span className="err small full-row">{log.errorMessage}</span>
              )}
            </div>
          ))}
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
