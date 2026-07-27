export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { recordServerHealth } = await import("@/lib/observability");
    recordServerHealth("commitbet_runtime_started");
  }
}
