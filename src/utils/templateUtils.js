export const CONTACT_PLACEHOLDERS = [
  { key: "hrName", label: "HR name", group: "contact" },
  { key: "companyName", label: "Company", group: "contact" },
  { key: "email", label: "Contact email", group: "contact" },
];

export const USER_PLACEHOLDER_DEFS = [
  { key: "regardsName", label: "Your name", field: "regardsName" },
  { key: "jobTitle", label: "Job title", field: "jobTitle" },
  { key: "phone", label: "Phone", field: "phone" },
  { key: "myEmail", label: "Your email", field: "myEmail" },
  { key: "linkedin", label: "LinkedIn URL", field: "linkedinUrl" },
  { key: "github", label: "GitHub URL", field: "githubUrl" },
  { key: "website", label: "Website", field: "websiteUrl" },
  { key: "location", label: "Location", field: "location" },
];

export const PLACEHOLDER_KEYS = [
  ...CONTACT_PLACEHOLDERS.map((p) => p.key),
  ...USER_PLACEHOLDER_DEFS.map((p) => p.key),
];

const SAMPLE_CONTACT = {
  hrName: "Jane Smith",
  companyName: "Acme Corp",
  email: "hr@acme.com",
};

export const buildPreviewData = (profile = {}) => ({
  ...SAMPLE_CONTACT,
  regardsName: profile.regardsName || "Your Name",
  phone: profile.phone || "+1 555 0100",
  myEmail: profile.myEmail || "you@example.com",
  linkedin: profile.linkedinUrl || "https://linkedin.com/in/yourprofile",
  github: profile.githubUrl || "https://github.com/yourname",
  website: profile.websiteUrl || "https://yourportfolio.com",
  jobTitle: profile.jobTitle || "Software Developer",
  location: profile.location || "City, Country",
});

export const getPlaceholders = (profile = {}) => {
  const preview = buildPreviewData(profile);
  return [
    ...CONTACT_PLACEHOLDERS.map((p) => ({
      ...p,
      sample: preview[p.key],
      group: "contact",
    })),
    ...USER_PLACEHOLDER_DEFS.map((p) => ({
      key: p.key,
      label: p.label,
      sample: preview[p.key],
      group: "you",
    })),
  ];
};

export const renderTemplate = (text, data = {}) => {
  if (!text) return "";
  let result = text;
  for (const key of PLACEHOLDER_KEYS) {
    result = result.replaceAll(`{{${key}}}`, data[key] ?? "");
  }
  return result;
};

export const profileFromUser = (user) => {
  if (!user) return {};
  if (user.profile) return user.profile;
  return {
    regardsName: user.regardsName || user.name || "",
    phone: user.phone || "",
    linkedinUrl: user.linkedinUrl || "",
    githubUrl: user.githubUrl || "",
    websiteUrl: user.websiteUrl || "",
    jobTitle: user.jobTitle || "",
    location: user.location || "",
    myEmail: user.email || "",
  };
};

export const emptyProfile = () => ({
  regardsName: "",
  phone: "",
  linkedinUrl: "",
  githubUrl: "",
  websiteUrl: "",
  jobTitle: "",
  location: "",
});

export const plainTextToHtml = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const paragraphs = trimmed.split(/\n\s*\n/);
  return `<div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
${paragraphs
    .map((p) => `  <p>${p.trim().replace(/\n/g, "<br />")}</p>`)
    .join("\n")}
</div>`;
};

export const htmlToPlain = (html) => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<\/div>\s*/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const signatureBlock = `Best regards,
{{regardsName}}
{{jobTitle}}
{{phone}} · {{myEmail}}
LinkedIn: {{linkedin}}`;

export const buildStarterTemplates = (profile = {}) => [
  {
    id: "job-application",
    name: "Job application",
    subject: "Application for opportunities at {{companyName}}",
    message: `Dear {{hrName}},

I am writing to express my interest in opportunities at {{companyName}}. I believe my experience would be a strong fit for your team.

Please find my resume attached. I would welcome the chance to discuss how I can contribute.

Thank you for your time and consideration.

${signatureBlock}`,
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Following up – {{companyName}}",
    message: `Dear {{hrName}},

I wanted to follow up on my previous application to {{companyName}}. I remain very interested and would appreciate any update when convenient.

Thank you,
${signatureBlock}`,
  },
  {
    id: "networking",
    name: "Networking intro",
    subject: "Introduction – interested in {{companyName}}",
    message: `Hi {{hrName}},

I came across {{companyName}} and was impressed by your work. I would love to connect and learn more about potential opportunities.

${signatureBlock}`,
  },
];
