import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

const TERMS_TITLE = `Terms of Use — ${SITE_NAME}`;

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: TERMS_TITLE,
    description: termsOfUse.intro,
    path: "/terms",
    type: "article",
    keywords: ["terms of use", "terms and conditions"],
  }),
};

export default function TermsPage() {
  return <LegalPage data={termsOfUse} />;
}
