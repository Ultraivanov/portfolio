const githubRepo = (process.env.KEYSTATIC_GITHUB_REPO ||
  "Ultraivanov/portfolio") as `${string}/${string}`;

export const keystaticMissingGitHubEnvVars = [
  "KEYSTATIC_GITHUB_CLIENT_ID",
  "KEYSTATIC_GITHUB_CLIENT_SECRET",
  "KEYSTATIC_SECRET",
].filter((name) => !process.env[name]);

export const isKeystaticGitHubConfigured =
  keystaticMissingGitHubEnvVars.length === 0;

export const isKeystaticProductionWithoutGitHub =
  process.env.NODE_ENV === "production" && !isKeystaticGitHubConfigured;

export const keystaticStorage = isKeystaticGitHubConfigured
  ? { kind: "github" as const, repo: githubRepo }
  : { kind: "local" as const };
