/**
 * @jest-environment node
 */
import { logCmsAuditEvent, resolveCmsAuditWho } from "@/lib/cms-audit-log";

describe("cms-audit-log", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves username from basic authorization header", () => {
    const header = `Basic ${Buffer.from("dima:secret").toString("base64")}`;
    expect(resolveCmsAuditWho(header)).toBe("dima");
  });

  it("returns unknown for missing or invalid authorization header", () => {
    expect(resolveCmsAuditWho()).toBe("unknown");
    expect(resolveCmsAuditWho("Bearer token")).toBe("unknown");
    expect(resolveCmsAuditWho("Basic not-base64")).toBe("unknown");
    expect(resolveCmsAuditWho(`Basic ${Buffer.from("nouser").toString("base64")}`)).toBe("unknown");
  });

  it("logs structured cms audit payload", () => {
    const spy = jest.spyOn(console, "info").mockImplementation(() => {});

    logCmsAuditEvent({
      what: "save-content",
      who: "dima",
      path: "src/content/cases/demo.json",
      result: "success",
      commitSha: "abc123",
      details: { source: "test" },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const firstArg = spy.mock.calls[0][0];
    expect(typeof firstArg).toBe("string");

    const payload = JSON.parse(String(firstArg)) as Record<string, unknown>;
    expect(payload.type).toBe("cms_audit");
    expect(payload.what).toBe("save-content");
    expect(payload.who).toBe("dima");
    expect(payload.path).toBe("src/content/cases/demo.json");
    expect(payload.result).toBe("success");
    expect(payload.commitSha).toBe("abc123");
    expect(payload.details).toEqual({ source: "test" });
    expect(typeof payload.when).toBe("string");
  });
});
