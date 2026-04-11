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
const forceLocalInAnyEnv = process.env.KEYSTATIC_FORCE_LOCAL === "1";

// Avoid server/client mode mismatch:
// by default, production uses GitHub and dev can fall back to local.
// KEYSTATIC_FORCE_LOCAL=1 is an emergency switch to disable GitHub mode.
export const shouldUseKeystaticLocalStorage =
  forceLocalInAnyEnv || (isDevelopment && !isKeystaticGitHubConfigured);

export const isKeystaticProductionWithoutGitHub =
  process.env.NODE_ENV === "production" &&
  !forceLocalInAnyEnv &&
  !isKeystaticGitHubConfigured;

export const keystaticStorage = shouldUseKeystaticLocalStorage
  ? { kind: "local" as const }
  : {
      kind: "github" as const,
      repo: githubRepo,
    };
