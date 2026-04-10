/**
 * Standard fetch options for JSON requests
 */
const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * Make a JSON POST request
 */
export const jsonPost = async <T = unknown>(
  url: string,
  body: unknown
): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};

/**
 * Make a JSON POST request with form-encoded body
 */
export const formPost = async <T = unknown>(
  url: string,
  body: URLSearchParams
): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
};
