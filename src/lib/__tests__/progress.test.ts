import { describe, expect, it } from "vitest";
import { projectProgress, validateReturnPercentage } from "@/lib/progress";

describe("progress helpers", () => {
  it("calculates approved-task progress", () => {
    expect(
      projectProgress([
        { status: "approved" },
        { status: "submitted" },
        { status: "approved" },
      ]),
    ).toBe(67);
    expect(projectProgress([])).toBe(0);
  });

  it("accepts only valid virtual pledge return percentages", () => {
    expect(validateReturnPercentage(0)).toBe(true);
    expect(validateReturnPercentage(100)).toBe(true);
    expect(validateReturnPercentage(120)).toBe(false);
    expect(validateReturnPercentage(Number.NaN)).toBe(false);
  });
});

describe("verified completion boundaries", () => {
  it("never credits submitted, rejected, disputed or in-progress work", () => {
    expect(
      projectProgress(
        [
          "todo",
          "in_progress",
          "submitted",
          "needs_changes",
          "rejected",
          "disputed",
        ].map((status) => ({ status })),
      ),
    ).toBe(0);
  });
  it("allows genuine 0 and 100 percent completion", () => {
    expect(projectProgress([{ status: "todo" }])).toBe(0);
    expect(projectProgress([{ status: "approved" }])).toBe(100);
  });
});
