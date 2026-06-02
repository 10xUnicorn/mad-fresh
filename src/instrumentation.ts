/**
 * Datadog APM + LLM Observability instrumentation
 * Next.js automatically loads this file via the instrumentation hook.
 * Disabled until DD_API_KEY is configured in environment.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // dd-trace requires DD_API_KEY for agentless mode.
  // Its module-level initialization throws without it,
  // so we skip the import entirely when the key is absent.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DD_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ddTrace = await import("dd-trace") as any;
    const tracer = ddTrace.default || ddTrace;

    tracer.init({
      service: "madfresh",
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "0.1.0",
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      llmobs: {
        enabled: true,
        mlApp: "madfresh",
        agentlessEnabled: true,
      },
    });
  }
}
