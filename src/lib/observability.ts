import "server-only";

type FailureContext = {
  operation: string;
  durationMs?: number;
  error?: unknown;
  provider?: string;
  model?: string;
};

function errorKind(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

export function recordServerFailure(context: FailureContext) {
  console.error(JSON.stringify({
    level: "error",
    event: "commitbet_operation_failed",
    operation: context.operation,
    duration_ms: context.durationMs,
    error_kind: errorKind(context.error),
    provider: context.provider,
    model: context.model,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  }));
}

export function recordServerHealth(event: string) {
  console.info(JSON.stringify({
    level: "info",
    event,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  }));
}
