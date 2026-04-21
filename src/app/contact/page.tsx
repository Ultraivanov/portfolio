import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";
import { contact } from "@/content/contact";

export const metadata: Metadata = {
  title: "Contact — Dima Ginzburg",
  description:
    "Get in touch for product design collaboration, consulting, and project discussions.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact — Dima Ginzburg",
    description:
      "Get in touch for product design collaboration, consulting, and project discussions.",
    url: "/contact",
    type: "website",
  },
};

export default function Contact() {
  return <ContactPage data={contact} />;
}
