const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export type GitHubFileMeta = {
  sha: string;
};

type GitHubResponse<T> =
  | { ok: true; status: number; data: T; headers: Headers }
  | { ok: false; status: number; message: string; headers: Headers };

const parseResponseBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const requestGitHub = async <T>(
  url: string,
  init: RequestInit,
  { timeoutMs = 15000, retries = 2 }: { timeoutMs?: number; retries?: number } = {},
): Promise<GitHubResponse<T>> => {
  let attempt = 0;
  let lastResponse: GitHubResponse<T> | null = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const body = await parseResponseBody(response);

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data: (body ?? {}) as T,
          headers: response.headers,
        };
      }

      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : `GitHub request failed (${response.status})`;

      const failedResponse: GitHubResponse<T> = {
        ok: false,
        status: response.status,
        message,
        headers: response.headers,
      };
      lastResponse = failedResponse;

      if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries) {
        return failedResponse;
      }

      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterMs = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) * 1000 : 0;
      const backoffMs = Math.max(retryAfterMs, 200 * 2 ** attempt);
      await wait(backoffMs);
      attempt += 1;
      continue;
    } catch (error) {
      clearTimeout(timeoutId);
      const isAbort = error instanceof Error && error.name === "AbortError";
      const message = isAbort ? "GitHub request timed out" : "GitHub request failed";

      if (attempt === retries) {
        return {
          ok: false,
          status: 0,
          message,
          headers: new Headers(),
        };
      }

      await wait(200 * 2 ** attempt);
      attempt += 1;
    }
  }

  return (
    lastResponse ?? {
      ok: false,
      status: 0,
      message: "GitHub request failed",
      headers: new Headers(),
    }
  );
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
});

export const getRepositoryFileMeta = async (params: {
  repo: string;
  branch: string;
  path: string;
  token: string;
}) =>
  requestGitHub<GitHubFileMeta>(
    `https://api.github.com/repos/${params.repo}/contents/${params.path}?ref=${params.branch}`,
    {
      method: "GET",
      headers: authHeaders(params.token),
    },
  );

export const putRepositoryFile = async (params: {
  repo: string;
  branch: string;
  path: string;
  token: string;
  message: string;
  base64Content: string;
  sha?: string;
}) =>
  requestGitHub(
    `https://api.github.com/repos/${params.repo}/contents/${params.path}`,
    {
      method: "PUT",
      headers: {
        ...authHeaders(params.token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: params.message,
        content: params.base64Content,
        branch: params.branch,
        sha: params.sha,
      }),
    },
  );
