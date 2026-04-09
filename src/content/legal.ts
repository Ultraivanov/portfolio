export type LegalItem = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  open?: boolean;
};

export type LegalPageContent = {
  title: string;
  updated: string;
  intro: string;
  items: LegalItem[];
};

export const privacyPolicy: LegalPageContent = {
  title: "Privacy Policy",
  updated: "Updated April 8, 2026",
  intro:
    "This Privacy Policy explains how personal data is handled when you use ginsburg.work and get in touch.",
  items: [
    {
      id: "01",
      title: "Who is responsible",
      body: [
        "The data controller is Dima Ginzburg. You can reach me at dima@ginzburg.work.",
      ],
    },
    {
      id: "02",
      title: "Information we collect",
      body: [
        "We collect the information you submit in the contact form (name, email, company, message).",
      ],
      bullets: [
        "Contact form fields and the page you submitted from",
        "Analytics data about page usage (only after consent)",
      ],
      open: true,
    },
    {
      id: "03",
      title: "Why we use your data",
      body: [
        "Your data is used to reply to your request, coordinate next steps, and understand how the site is used.",
      ],
      bullets: [
        "Respond to inquiries and schedule conversations",
        "Improve site clarity and navigation",
      ],
    },
    {
      id: "04",
      title: "Legal basis (GDPR)",
      body: [
        "For contact requests, the legal basis is legitimate interest (responding to professional inquiries) and, where applicable, steps to enter a contract.",
        "For analytics, the legal basis is consent.",
      ],
    },
    {
      id: "05",
      title: "Analytics and cookies",
      body: [
        "Google Analytics is used to understand what content is read and what is skipped. Analytics runs only after you consent.",
        "You can withdraw consent at any time by clearing site storage in your browser.",
      ],
    },
    {
      id: "06",
      title: "Where data is stored",
      body: [
        "Contact submissions are stored in Airtable. Hosting and delivery are provided by Vercel. Analytics data is processed by Google Analytics.",
        "We use Cloudflare Turnstile for anti-spam verification on the contact form.",
      ],
      bullets: [
        "Airtable may process data outside your country (including the United States).",
        "We do not sell or rent your data.",
      ],
    },
    {
      id: "07",
      title: "Data retention",
      body: [
        "Contact messages are stored for up to 12 months unless you request deletion earlier.",
      ],
    },
    {
      id: "08",
      title: "Your rights",
      body: [
        "You can request access, correction, deletion, restriction, or a copy of your data. You can also object to processing and withdraw consent for analytics.",
        "If you are in the EEA/UK, you may lodge a complaint with your local supervisory authority.",
      ],
    },
    {
      id: "09",
      title: "Security",
      body: [
        "Reasonable technical and organizational measures are used to protect your data.",
      ],
    },
    {
      id: "10",
      title: "Changes to this policy",
      body: ["We may update this policy from time to time and will post the latest version here."],
    },
    {
      id: "11",
      title: "Contact",
      body: ["Questions about privacy can be sent to dima@ginzburg.work."],
    },
  ],
};

export const termsOfUse: LegalPageContent = {
  title: "Terms of Use",
  updated: "Updated April 4, 2026",
  intro:
    "These Terms describe how you can use ginsburg.work and its content.",
  items: [
    {
      id: "01",
      title: "Use of content",
      body: [
        "All case studies, text, and visuals are provided for review and evaluation purposes only.",
      ],
      bullets: ["Do not reuse, copy, or redistribute without permission", "Screens may be anonymized"],
      open: true,
    },
    {
      id: "02",
      title: "Accuracy",
      body: [
        "The portfolio is provided as-is. While it is kept accurate, details may change as projects evolve.",
      ],
    },
    {
      id: "03",
      title: "Third-party links",
      body: [
        "This site may contain links to third-party websites. We are not responsible for their content.",
      ],
    },
    {
      id: "04",
      title: "Availability",
      body: ["Access to the site may be interrupted for maintenance or updates."],
    },
    {
      id: "05",
      title: "Contact",
      body: ["For usage questions, email dima@ginzburg.work."],
    },
  ],
};
