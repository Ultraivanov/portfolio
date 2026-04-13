import {
  isCaseSlug,
  readCaseBySlug,
  readCaseSummaries,
} from "@/lib/content/case-files";

describe("case files loader", () => {
  it("validates slug format", () => {
    expect(isCaseSlug("railway-booking-flow")).toBe(true);
    expect(isCaseSlug("../railway-booking-flow")).toBe(false);
    expect(isCaseSlug("railway_booking_flow")).toBe(false);
  });

  it("reads case summaries", async () => {
    const summaries = await readCaseSummaries();
    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries[0]).toHaveProperty("slug");
    expect(summaries[0]).toHaveProperty("title");
  });

  it("reads case by slug", async () => {
    const caseData = await readCaseBySlug("railway-booking-flow");
    expect(caseData).toBeTruthy();
    expect(typeof caseData).toBe("object");
  });
});
