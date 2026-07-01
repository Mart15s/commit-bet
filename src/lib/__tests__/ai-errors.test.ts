import { afterEach, describe, expect, it, vi } from "vitest";
import { AiError, classifyProviderError, normalizeAiError } from "@/lib/ai/errors";
import { DEFAULT_GEMINI_FALLBACK_MODEL, DEFAULT_GEMINI_MODEL, generateGeminiStructured } from "@/lib/ai/gemini";
import { generateProjectPlan } from "@/lib/ai/service";
import { projectPlanSchema } from "@/lib/validation";

const planJson = {
  phases: [{ name: "Plan", description: "Align on proof." }],
  deliverables: ["Working demo"],
  tasks: [
    {
      title: "Ship demo",
      description: "Build the demo.",
      assigned_user_id: "11111111-1111-4111-8111-111111111111",
      assigned_reason: "Best fit.",
      priority: "high",
      due_date: "2026-07-07",
      acceptance_criteria: ["Demo works"],
      expected_evidence_types: ["demo"],
    },
  ],
  risks: ["Scope creep"],
  minimum_success_version: "A working demo.",
  ambitious_success_version: "A polished demo.",
};

describe("AI error handling", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("maps high-demand provider errors to model_overloaded", () => {
    expect(classifyProviderError(503, "This model is currently experiencing high demand.")).toBe("model_overloaded");
  });

  it("normalizes missing API key errors", () => {
    const error = normalizeAiError(new AiError("missing_api_key"));
    expect(error).toMatchObject({
      code: "missing_api_key",
      retryable: false,
    });
    expect(error.message).toContain("GEMINI_API_KEY");
  });

  it("retries the fallback Gemini model once for overload failures", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const urls: string[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      urls.push(String(url));
      if (urls.length === 1) {
        return new Response(JSON.stringify({ error: { message: "This model is currently experiencing high demand." } }), { status: 503 });
      }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(planJson) }] } }] }), { status: 200 });
    });

    const result = await generateGeminiStructured({
      schema: projectPlanSchema,
      schemaName: "project_plan",
      prompt: "Return JSON",
      input: {},
      fetcher: fetcher as typeof fetch,
    });

    expect(result.model).toBe(DEFAULT_GEMINI_FALLBACK_MODEL);
    expect(result.fallbackUsed).toBe(true);
    expect(urls[0]).toContain(DEFAULT_GEMINI_MODEL);
    expect(urls[1]).toContain(DEFAULT_GEMINI_FALLBACK_MODEL);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("turns malformed JSON into invalid_ai_output after one repair retry", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    const fetcher = vi.fn(async () => (
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "{nope" }] } }] }), { status: 200 })
    ));

    await expect(generateGeminiStructured({
      schema: projectPlanSchema,
      schemaName: "project_plan",
      prompt: "Return JSON",
      input: {},
      fetcher: fetcher as typeof fetch,
    })).rejects.toMatchObject({ code: "invalid_ai_output" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("uses a deterministic fallback when Gemini is not configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const result = await generateProjectPlan({
      title: "Build CommitBet",
      goal: "Ship the sprint",
      successCriteria: ["Demo works"],
      startDate: "2026-07-01",
      endDate: "2026-07-07",
      members: [{ user_id: "11111111-1111-4111-8111-111111111111", name: "Martynas", strengths: ["backend"], availability_minutes_per_day: 90 }],
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.error?.code).toBe("missing_api_key");
    expect(projectPlanSchema.safeParse(result.output).success).toBe(true);
  });
});
