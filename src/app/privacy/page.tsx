import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Dima Ginzburg",
  description: "Privacy policy for dima.ginzburg portfolio website and contact flows.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalPage data={privacyPolicy} />;
}
