import LegalPage from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";

export default function PrivacyPage() {
  return <LegalPage data={privacyPolicy} />;
}
