const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const CMS_SESSION_COOKIE = "cms_session";
export const CMS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type CmsSessionPayload = {
  user: string;
  exp: number;
};

type CmsCredentials = {
  username: string;
  password: string;
  sessionSecret: string;
};

export function getCmsCredentials(): CmsCredentials | null {
  const username = process.env.CMS_ADMIN_USER?.trim();
  const password = process.env.CMS_ADMIN_PASSWORD;
  const sessionSecret = process.env.CMS_SESSION_SECRET;

  if (!username || !password || !sessionSecret) {
    return null;
  }

  return {
    username,
    password,
    sessionSecret,
  };
}

export function isCmsLoginValid(input: {
  username: string;
  password: string;
  credentials: Pick<CmsCredentials, "username" | "password">;
}): boolean {
  return (
    input.username.trim().toLowerCase() === input.credentials.username.trim().toLowerCase() &&
    input.password === input.credentials.password
  );
}

export async function createCmsSessionToken(input: {
  user: string;
  sessionSecret: string;
  nowMs?: number;
  maxAgeSeconds?: number;
}): Promise<string> {
  const issuedAt = typeof input.nowMs === "number" ? input.nowMs : Date.now();
  const maxAge = input.maxAgeSeconds ?? CMS_SESSION_MAX_AGE_SECONDS;

  const payload: CmsSessionPayload = {
    user: input.user,
    exp: Math.floor(issuedAt / 1000) + maxAge,
  };

  const payloadEncoded = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await signHmac(payloadEncoded, input.sessionSecret);

  return `${payloadEncoded}.${signature}`;
}

export async function verifyCmsSessionToken(input: {
  token: string;
  sessionSecret: string;
  expectedUser?: string;
  nowMs?: number;
}): Promise<CmsSessionPayload | null> {
  const parts = input.token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const payloadPart = parts[0];
  const signaturePart = parts[1];
  const expectedSignature = await signHmac(payloadPart, input.sessionSecret);
  if (!timingSafeEqual(expectedSignature, signaturePart)) {
    return null;
  }

  const payloadBytes = fromBase64Url(payloadPart);
  if (!payloadBytes) {
    return null;
  }

  try {
    const parsed = JSON.parse(textDecoder.decode(payloadBytes)) as Partial<CmsSessionPayload>;
    if (typeof parsed.user !== "string" || typeof parsed.exp !== "number") {
      return null;
    }

    const nowSeconds = Math.floor((input.nowMs ?? Date.now()) / 1000);
    if (parsed.exp <= nowSeconds) {
      return null;
    }

    if (
      input.expectedUser &&
      parsed.user.trim().toLowerCase() !== input.expectedUser.trim().toLowerCase()
    ) {
      return null;
    }

    return {
      user: parsed.user,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(";")) {
    const [rawName, ...rest] = entry.trim().split("=");
    if (rawName === cookieName && rest.length > 0) {
      return rest.join("=");
    }
  }

  return null;
}

export async function isCmsSessionAuthorized(request: Request): Promise<boolean> {
  const credentials = getCmsCredentials();
  if (!credentials) {
    return false;
  }

  const token = readCookieValue(request.headers.get("cookie"), CMS_SESSION_COOKIE);
  if (!token) {
    return false;
  }

  const payload = await verifyCmsSessionToken({
    token,
    sessionSecret: credentials.sessionSecret,
    expectedUser: credentials.username,
  });

  return Boolean(payload);
}

async function signHmac(input: string, secret: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this runtime.");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign("HMAC", key, textEncoder.encode(input));
  return toBase64Url(new Uint8Array(signature));
}

function toBase64Url(bytes: Uint8Array): string {
  const base64 = toBase64(bytes);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized.length % 4 === 0
        ? normalized
        : normalized + "=".repeat(4 - (normalized.length % 4));
    return fromBase64(padded);
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa !== "function") {
    throw new Error("btoa is not available in this runtime.");
  }
  let binary = "";
  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (typeof atob !== "function") {
    throw new Error("atob is not available in this runtime.");
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
