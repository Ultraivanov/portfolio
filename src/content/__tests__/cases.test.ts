import { cases, getCaseBySlug } from "@/content/cases";

describe("cases content loader", () => {
  it("returns undefined for unknown slug", () => {
    expect(getCaseBySlug("does-not-exist")).toBeUndefined();
  });

  it("keeps expected preferred order on top", () => {
    expect(cases[0]?.slug).toBe("travel-booking-platform");
    expect(cases[1]?.slug).toBe("railway-booking-flow");
  });
});
