type CmsAuditWhat = "save-content" | "upload-image" | "upload-image-cleanup";
type CmsAuditResult = "success" | "skipped" | "conflict" | "error";

export interface CmsAuditLogInput {
  what: CmsAuditWhat;
  path?: string;
  result: CmsAuditResult;
  commitSha?: string | null;
  who?: string;
  details?: Record<string, unknown>;
}

export function resolveCmsAuditWho(authorizationHeader?: string | null): string {
  if (!authorizationHeader) {
    return "unknown";
  }

  if (!authorizationHeader.startsWith("Basic ")) {
    const directUser = authorizationHeader.trim();
    if (/^[A-Za-z0-9._-]+$/u.test(directUser)) {
      return directUser;
    }
    return "unknown";
  }

  const encoded = authorizationHeader.slice(6).trim();
  if (!encoded) {
    return "unknown";
  }

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex <= 0) {
      return "unknown";
    }
    const username = decoded.slice(0, separatorIndex).trim();
    return username || "unknown";
  } catch {
    return "unknown";
  }
}

export function logCmsAuditEvent(input: CmsAuditLogInput): void {
  const payload = {
    type: "cms_audit",
    when: new Date().toISOString(),
    what: input.what,
    who: input.who || "unknown",
    path: input.path || "",
    result: input.result,
    commitSha: input.commitSha ?? null,
    details: input.details || {},
  };

  console.info(JSON.stringify(payload));
}
