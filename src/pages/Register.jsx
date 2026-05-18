import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppPasswordHint from "../components/AppPasswordHint";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    appPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!form.appPassword.trim()) {
      setError("Gmail app password is required for your primary sending email");
      return;
    }

    if (form.appPassword.replace(/\s/g, "").length < 16) {
      setError("App password must be at least 16 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        appPassword: form.appPassword,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">MailStation</p>
        <h1>Create account</h1>
        <p className="muted small">
          Your sign-up email becomes your primary default sender.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email (primary sender)
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </label>
          <label>
            Gmail app password (for the email above)
            <input
              type="password"
              placeholder="16-character app password"
              value={form.appPassword}
              onChange={(e) =>
                setForm({ ...form, appPassword: e.target.value })
              }
              required
              autoComplete="new-password"
            />
            <AppPasswordHint />
          </label>
          {error && <p className="err">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="muted center">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
