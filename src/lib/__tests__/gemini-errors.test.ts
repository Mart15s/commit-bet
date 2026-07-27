import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  classifyGeminiError,
  geminiRetryDelayMs,
  toGeminiJsonSchema,
} from "@/lib/ai/gemini-errors";
import { projectPlanSchema } from "@/lib/validation";

describe("Gemini error safety", () => {
  it.each([
    [400, "request_or_schema"],
    [401, "authentication_or_permission"],
    [403, "authentication_or_permission"],
    [404, "model_or_endpoint"],
    [429, "quota_or_rate_limit"],
    [500, "provider_transient"],
    [503, "provider_transient"],
  ] as const)("classifies HTTP %s without using an upstream message", (status, category) => {
    expect(classifyGeminiError({
      status,
      message: "secret-key and private user payload",
    })).toEqual({ httpStatus: status, category });
  });

  it("retries only rate limits, provider failures, and timeouts", () => {
    expect(geminiRetryDelayMs({ status: 429 }, 0)).toBe(10_000);
    expect(geminiRetryDelayMs({ status: 429 }, 1)).toBe(20_000);
    expect(geminiRetryDelayMs({ status: 503 }, 1)).toBe(1000);
    expect(geminiRetryDelayMs({ name: "TimeoutError" }, 0)).toBe(500);
    expect(geminiRetryDelayMs({ status: 400 }, 0)).toBeNull();
    expect(geminiRetryDelayMs({ status: 403 }, 0)).toBeNull();
    expect(geminiRetryDelayMs({ status: 429 }, 2)).toBeNull();
    expect(geminiRetryDelayMs({ status: 503 }, 2)).toBeNull();
  });

  it("removes unsupported provider constraints but keeps runtime Zod validation", () => {
    const providerSchema = toGeminiJsonSchema(
      z.toJSONSchema(projectPlanSchema),
    );
    const serialized = JSON.stringify(providerSchema);

    expect(serialized).not.toContain('"minLength"');
    expect(serialized).not.toContain('"maxLength"');
    expect(serialized).not.toContain('"format":"uuid"');
    expect(serialized).not.toContain('"$schema"');
    expect(serialized).not.toContain('"maxItems"');
    expect(serialized).toContain('"format":"date"');
    expect(serialized).toContain('"minItems":1');
    expect(serialized).toContain('"propertyOrdering"');

    expect(() => projectPlanSchema.parse({
      phases: [],
      deliverables: [],
      tasks: [{
        title: "x".repeat(121),
        description: "Description",
        assigned_user_id: "not-a-uuid",
        assigned_reason: "Reason",
        priority: "high",
        due_date: "2026-07-28",
        acceptance_criteria: ["Criterion"],
        expected_evidence_types: ["Screenshot"],
      }],
      risks: [],
      minimum_success_version: "Minimum",
      ambitious_success_version: "Ambitious",
    })).toThrow();
  });
});
