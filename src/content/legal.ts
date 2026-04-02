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
  updated: "Updated March 26, 2026",
  intro:
    "This Privacy Policy explains how we collect, use, and protect information when you use this website and contact the designer.",
  items: [
    {
      id: "01",
      title: "Information we collect",
      body: [
        "We only collect information you choose to share, such as your name, email, company, and message.",
      ],
      bullets: [
        "Contact details you submit via the site",
        "Basic analytics about page usage",
        "Any files or links you include in your message",
      ],
      open: true,
    },
    {
      id: "02",
      title: "How we use your information",
      body: ["Your information is used only to respond to your inquiry and continue the conversation."],
      bullets: ["Reply to messages", "Coordinate interviews and collaborations", "Improve the clarity of the site"],
    },
    {
      id: "03",
      title: "Sharing your information",
      body: ["We do not sell or rent your personal information."],
      bullets: ["We may share it only if required by law", "No third-party marketing or ad networks"],
    },
    {
      id: "04",
      title: "Data retention",
      body: [
        "Messages are retained only as long as needed for communication and record-keeping.",
      ],
    },
    {
      id: "05",
      title: "Your rights",
      body: [
        "You can request access, correction, or deletion of your data by contacting us.",
      ],
    },
    {
      id: "06",
      title: "Security",
      body: [
        "Reasonable technical and organizational measures are used to protect your data.",
      ],
    },
    {
      id: "07",
      title: "Changes to this policy",
      body: ["We may update this policy from time to time and will post the latest version here."],
    },
    {
      id: "08",
      title: "Contact",
      body: ["Questions about privacy can be sent to hello@example.com."],
    },
  ],
};

export const termsOfUse: LegalPageContent = {
  title: "Terms of Use",
  updated: "Updated March 26, 2026",
  intro:
    "These Terms describe how you can use this portfolio website and its content.",
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
      body: ["For usage questions, email hello@example.com."],
    },
  ],
};
