export default function AppPasswordHint() {
  return (
    <p className="field-hint muted small">
      In your Google Account, turn on 2-Step Verification, then go to Security →
      App passwords. Create one for Mail, then paste the 16-character password
      here (spaces are optional).{" "}
      <a
        href="https://myaccount.google.com/apppasswords"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open App passwords
      </a>
    </p>
  );
}
