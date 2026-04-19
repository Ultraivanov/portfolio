import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";
import { contact } from "@/content/contact";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

const CONTACT_TITLE = `Contact — ${SITE_NAME}`;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: CONTACT_TITLE,
    description: contact.subtitle,
    path: "/contact",
    keywords: ["product designer contact", "hire product designer"],
  }),
};

export default function Contact() {
  return <ContactPage data={contact} />;
}
