import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { recordServerFailure } from "@/lib/observability";

describe("server failure observability", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs only safe Gemini failure metadata", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    recordServerFailure({
      operation: "gemini_structured_generation",
      durationMs: 1234,
      httpStatus: 400,
      errorCategory: "request_or_schema",
      provider: "gemini",
      model: "gemini-3.6-flash",
    });

    expect(error).toHaveBeenCalledOnce();
    const serialized = String(error.mock.calls[0]?.[0]);
    expect(JSON.parse(serialized)).toEqual({
      level: "error",
      event: "commitbet_operation_failed",
      operation: "gemini_structured_generation",
      duration_ms: 1234,
      http_status: 400,
      error_category: "request_or_schema",
      provider: "gemini",
      model: "gemini-3.6-flash",
    });
    expect(serialized).not.toContain("api_key");
    expect(serialized).not.toContain("prompt");
    expect(serialized).not.toContain("payload");
    expect(serialized).not.toContain("headers");
    expect(serialized).not.toContain("response");
  });
});
