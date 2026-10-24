import { describe, expect, it } from "vitest";
import { exampleSprint, getExampleSprintMetrics } from "../example-sprint";

describe("illustrative marketing sprint", () => {
  it("keeps submissions separate from peer-approved work throughout the sprint", () => {
    for (let day = 0; day <= exampleSprint.duration; day++) {
      const metrics = getExampleSprintMetrics(day);
      expect(metrics.verified).toBeLessThanOrEqual(metrics.submitted);
      expect(metrics.submitted).toBeLessThanOrEqual(metrics.total);
      expect(metrics.pending + metrics.verified).toBe(metrics.submitted);
      expect(metrics.percent).toBe(Math.round(metrics.verified / metrics.total * 100));
    }
  });
  it("does not count a future submission or approval as current progress", () => {
    expect(getExampleSprintMetrics(0)).toMatchObject({ submitted: 0, verified: 0, percent: 0 });
    expect(getExampleSprintMetrics(3)).toMatchObject({ submitted: 1, verified: 0, pending: 1 });
    expect(getExampleSprintMetrics()).toEqual({ total: 6, submitted: 5, verified: 3, pending: 2, percent: 50 });
  });
});
