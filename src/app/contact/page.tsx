import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";
import { contact } from "@/content/contact";
import { SITE_NAME } from "@/lib/seo";

const CONTACT_TITLE = `Contact — ${SITE_NAME}`;

export const metadata: Metadata = {
  title: CONTACT_TITLE,
  description: contact.subtitle,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: CONTACT_TITLE,
    description: contact.subtitle,
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: CONTACT_TITLE,
    description: contact.subtitle,
  },
};

export default function Contact() {
  return <ContactPage data={contact} />;
}
