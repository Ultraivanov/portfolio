import LegalPage from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";

export default function TermsPage() {
  return <LegalPage data={termsOfUse} />;
}
