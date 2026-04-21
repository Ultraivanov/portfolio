import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use — Dima Ginzburg",
  description: "Terms of use for dima.ginzburg portfolio website.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <LegalPage data={termsOfUse} />;
}
