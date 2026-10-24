import { describe, expect, it } from "vitest";
import { sprintTime } from "@/lib/progress";
describe("sprint calendar, independent from completion", () => {
  it("has zero elapsed time at the start and before the start", () => {
    expect(sprintTime("2026-10-24", "2026-10-30", "2026-10-24")).toMatchObject({
      day: 1,
      total: 7,
      elapsed: 0,
      ended: false,
    });
    expect(sprintTime("2026-10-24", "2026-10-30", "2026-10-23")).toMatchObject({
      elapsed: 0,
      upcoming: true,
    });
  });
  it("includes the final day and reports expired sprints at 100 percent elapsed", () => {
    expect(sprintTime("2026-10-24", "2026-10-30", "2026-10-30")).toMatchObject({
      day: 7,
      elapsed: 86,
      ended: false,
    });
    expect(sprintTime("2026-10-24", "2026-10-30", "2026-10-31")).toMatchObject({
      day: 7,
      elapsed: 100,
      ended: true,
    });
  });
  it("handles one-day sprints and invalid ranges", () => {
    expect(sprintTime("2026-10-24", "2026-10-24", "2026-10-25")).toMatchObject({
      total: 1,
      elapsed: 100,
    });
    expect(sprintTime("invalid", "2026-10-24", "2026-10-24")).toBeNull();
    expect(sprintTime("2026-10-25", "2026-10-24", "2026-10-24")).toBeNull();
  });
});
