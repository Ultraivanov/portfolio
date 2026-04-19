import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";
import { SITE_NAME } from "@/lib/seo";

const TERMS_TITLE = `Terms of Use — ${SITE_NAME}`;

export const metadata: Metadata = {
  title: TERMS_TITLE,
  description: termsOfUse.intro,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: TERMS_TITLE,
    description: termsOfUse.intro,
    url: "/terms",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TERMS_TITLE,
    description: termsOfUse.intro,
  },
};

export default function TermsPage() {
  return <LegalPage data={termsOfUse} />;
}
