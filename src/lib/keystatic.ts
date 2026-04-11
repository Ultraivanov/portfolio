const githubRepo = (process.env.KEYSTATIC_GITHUB_REPO ||
  "Ultraivanov/portfolio") as `${string}/${string}`;

export const keystaticMissingGitHubEnvVars = [
  "KEYSTATIC_GITHUB_CLIENT_ID",
  "KEYSTATIC_GITHUB_CLIENT_SECRET",
  "KEYSTATIC_SECRET",
].filter((name) => !process.env[name]);

export const isKeystaticGitHubConfigured =
  keystaticMissingGitHubEnvVars.length === 0;

const isDevelopment = process.env.NODE_ENV === "development";

// Avoid server/client mode mismatch:
// in production we always use GitHub storage, while dev can fall back to local.
export const shouldUseKeystaticLocalStorage =
  isDevelopment && !isKeystaticGitHubConfigured;

export const isKeystaticProductionWithoutGitHub =
  process.env.NODE_ENV === "production" && !isKeystaticGitHubConfigured;

export const keystaticStorage = shouldUseKeystaticLocalStorage
  ? { kind: "local" as const }
  : {
      kind: "github" as const,
      repo: githubRepo,
    };
