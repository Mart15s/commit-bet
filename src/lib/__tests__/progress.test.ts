import { describe, expect, it } from "vitest";
import { projectProgress, validateReturnPercentage } from "@/lib/progress";

describe("progress helpers", () => {
  it("calculates approved-task progress", () => {
    expect(projectProgress([{ status: "approved" }, { status: "submitted" }, { status: "approved" }])).toBe(67);
    expect(projectProgress([])).toBe(0);
  });

  it("accepts only valid virtual pledge return percentages", () => {
    expect(validateReturnPercentage(0)).toBe(true);
    expect(validateReturnPercentage(100)).toBe(true);
    expect(validateReturnPercentage(120)).toBe(false);
    expect(validateReturnPercentage(Number.NaN)).toBe(false);
  });
});

