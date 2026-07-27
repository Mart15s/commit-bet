import "server-only";

type FailureContext = {
  operation: string;
  durationMs: number;
  httpStatus?: number;
  errorCategory: string;
  provider: string;
  model: string;
};

export function recordServerFailure(context: FailureContext) {
  console.error(JSON.stringify({
    level: "error",
    event: "commitbet_operation_failed",
    operation: context.operation,
    duration_ms: context.durationMs,
    http_status: context.httpStatus,
    error_category: context.errorCategory,
    provider: context.provider,
    model: context.model,
  }));
}

export function recordServerHealth(event: string) {
  console.info(JSON.stringify({
    level: "info",
    event,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  }));
}
