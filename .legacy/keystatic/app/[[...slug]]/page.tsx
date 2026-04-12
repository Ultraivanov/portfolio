import KeystaticApp from "./KeystaticApp";
import {
  isKeystaticProductionWithoutGitHub,
  keystaticMissingGitHubEnvVars,
} from "@/lib/keystatic";

export default function KeystaticPage() {
  if (isKeystaticProductionWithoutGitHub) {
    return (
      <main style={{ maxWidth: 720, padding: "48px 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          CMS is not configured for deployed editing
        </h1>
        <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
          This project falls back to Keystatic local storage when GitHub
          credentials are missing. That works in local development, but it is
          not a safe production setup for a deployed Next.js app.
        </p>
        <p style={{ marginBottom: "0.75rem", lineHeight: 1.6 }}>
          Configure GitHub mode for the deployed environment before using the
          admin UI.
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          {keystaticMissingGitHubEnvVars.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </main>
    );
  }

  return <KeystaticApp />;
}
