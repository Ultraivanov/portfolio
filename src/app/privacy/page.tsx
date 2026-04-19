import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";
import { SITE_NAME } from "@/lib/seo";

const PRIVACY_TITLE = `Privacy Policy — ${SITE_NAME}`;

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: privacyPolicy.intro,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: PRIVACY_TITLE,
    description: privacyPolicy.intro,
    url: "/privacy",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: PRIVACY_TITLE,
    description: privacyPolicy.intro,
  },
};

export default function PrivacyPage() {
  return <LegalPage data={privacyPolicy} />;
}
