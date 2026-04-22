const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 300;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface GitHubRetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
}

export async function fetchGitHubWithRetry(
  url: string,
  init: RequestInit,
  options: GitHubRetryOptions = {}
): Promise<Response> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_RETRY_ATTEMPTS);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS);
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!shouldRetryStatus(response.status) || attempt === attempts) {
        return response;
      }

      await wait(getRetryDelayMs(response, baseDelayMs, attempt));
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await wait(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("GitHub request failed after retries");
}

function shouldRetryStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

function getRetryDelayMs(
  response: Response,
  baseDelayMs: number,
  attempt: number
): number {
  const fallbackDelayMs = baseDelayMs * 2 ** (attempt - 1);
  const retryAfterHeader = response.headers.get("retry-after");
  if (!retryAfterHeader) {
    return fallbackDelayMs;
  }

  const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
  if (retryAfterMs !== null) {
    return retryAfterMs;
  }

  return fallbackDelayMs;
}

function parseRetryAfterMs(retryAfterHeader: string): number | null {
  const normalized = retryAfterHeader.trim();
  if (!normalized) {
    return null;
  }

  const seconds = Number(normalized);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.floor(seconds * 1000);
  }

  const dateMs = Date.parse(normalized);
  if (!Number.isFinite(dateMs)) {
    return null;
  }

  return Math.max(0, dateMs - Date.now());
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
