import { useEffect, useState } from "react";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../api";
import Modal from "../components/Modal";

const empty = { companyName: "", email: "", hrName: "", notes: "" };

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setContacts(await getContacts());
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  };

  const startEdit = (c) => {
    setEditId(c._id);
    setForm({
      companyName: c.companyName,
      email: c.email,
      hrName: c.hrName,
      notes: c.notes || "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(empty);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        await updateContact(editId, form);
        setStatus("Contact updated");
      } else {
        await createContact(form);
        setStatus("Contact added");
      }
      closeModal();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contact?")) return;
    try {
      await deleteContact(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Contacts</p>
          <h2>Companies & HR</h2>
        </div>
        <div className="header-actions">
          {status && <span className="ok">{status}</span>}
          <button type="button" onClick={openAdd}>
            + Add contact
          </button>
        </div>
      </header>

      <section className="card">
        <div className="list-header">
          <h3>All contacts</h3>
          <span className="muted">{contacts.length}</span>
        </div>
        {!contacts.length ? (
          <p className="muted">
            No contacts yet.{" "}
            <button type="button" className="btn-sm" onClick={openAdd}>
              Add your first contact
            </button>
          </p>
        ) : (
          <div className="table-scroll wide">
            <div className="table">
              <div className="table-head">
                <span>Company</span>
                <span>HR</span>
                <span>Email</span>
                <span>Status</span>
                <span></span>
              </div>
              {contacts.map((c) => (
                <div className="table-row" key={c._id}>
                  <span>{c.companyName}</span>
                  <span>{c.hrName}</span>
                  <span className="muted">{c.email}</span>
                  <span className={`pill ${c.status}`}>{c.status}</span>
                  <span className="actions">
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => startEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-sm danger"
                      onClick={() => handleDelete(c._id)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? "Edit contact" : "Add contact"}
      >
        <form onSubmit={handleSubmit} className="form">
          <label>
            Company
            <input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              required
            />
          </label>
          <label>
            HR name
            <input
              value={form.hrName}
              onChange={(e) => setForm({ ...form, hrName: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Notes
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          {error && <p className="err">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit">{editId ? "Update" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
