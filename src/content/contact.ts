export type ContactContent = {
  title: string;
  subtitle: string;
  email: string;
  availability: string;
  location: string;
  note: string;
};

export const contact: ContactContent = {
  title: "Get in touch",
  subtitle:
    "If you want to discuss a product, case study, or role, send a short brief and I will reply with next steps.",
  email: "hello@example.com",
  availability: "Available for product and system design projects",
  location: "Based in Tel Aviv · Open to global teams",
  note: "Please include context, timelines, and decision owner so I can respond faster.",
};
