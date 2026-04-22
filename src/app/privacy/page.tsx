import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

const PRIVACY_TITLE = `Privacy Policy — ${SITE_NAME}`;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: PRIVACY_TITLE,
    description: privacyPolicy.intro,
    path: "/privacy",
    type: "article",
    keywords: ["privacy policy", "personal data processing"],
  }),
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalPage data={privacyPolicy} />;
}
