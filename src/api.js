const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const getToken = () => localStorage.getItem("mailstation_token");

export const setToken = (token) => {
  if (token) localStorage.setItem("mailstation_token", token);
  else localStorage.removeItem("mailstation_token");
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

const request = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return handleResponse(res);
};

export const register = (body) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(body) });

export const login = (body) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(body) });

export const getMe = () => request("/api/auth/me");

export const updateProfile = (profile) =>
  request("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

/** @deprecated use updateProfile */
export const updateRegardsName = (regardsName) =>
  updateProfile({ regardsName });

export const getEmailAccounts = () => request("/api/email-accounts");

export const createEmailAccount = (body) =>
  request("/api/email-accounts", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateEmailAccount = (id, body) =>
  request(`/api/email-accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteEmailAccount = (id) =>
  request(`/api/email-accounts/${id}`, { method: "DELETE" });

export const setDefaultEmailAccount = (id) =>
  request(`/api/email-accounts/${id}/default`, { method: "PATCH" });

export const getContacts = () => request("/api/contacts");
export const createContact = (body) =>
  request("/api/contacts", { method: "POST", body: JSON.stringify(body) });
export const updateContact = (id, body) =>
  request(`/api/contacts/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteContact = (id) =>
  request(`/api/contacts/${id}`, { method: "DELETE" });

export const getTemplates = () => request("/api/templates");
export const createTemplate = (body) =>
  request("/api/templates", { method: "POST", body: JSON.stringify(body) });
export const updateTemplate = (id, body) =>
  request(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTemplate = (id) =>
  request(`/api/templates/${id}`, { method: "DELETE" });

export const getResumes = () => request("/api/resumes");
export const uploadResume = (formData) =>
  request("/api/resumes", { method: "POST", body: formData });
export const deleteResume = (id) =>
  request(`/api/resumes/${id}`, { method: "DELETE" });

export const getScheduled = () => request("/api/scheduled");
export const createScheduled = (body) =>
  request("/api/scheduled", { method: "POST", body: JSON.stringify(body) });
export const bulkSchedule = (body) =>
  request("/api/scheduled/bulk", { method: "POST", body: JSON.stringify(body) });
export const cancelScheduled = (id) =>
  request(`/api/scheduled/${id}/cancel`, { method: "PATCH" });
export const deleteScheduled = (id) =>
  request(`/api/scheduled/${id}`, { method: "DELETE" });

export const sendEmailNow = (body) =>
  request("/api/email/send", { method: "POST", body: JSON.stringify(body) });

export const getLogs = () => request("/api/logs");
