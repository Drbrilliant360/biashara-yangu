// Structured JSON logs (one line per event) so Supabase Logs / a log drain can filter and alert
// on level=error. Never pass phone numbers, emails, tokens or full provider responses here.

type Level = "info" | "warn" | "error";

export function makeLogger(fn: string, req?: Request) {
  const rid = req?.headers.get("x-request-id") ?? crypto.randomUUID();
  const emit = (level: Level, event: string, data: Record<string, unknown> = {}) => {
    const line = JSON.stringify({ level, fn, event, rid, ts: new Date().toISOString(), ...data });
    if (level === "error") console.error(line); else if (level === "warn") console.warn(line); else console.log(line);
  };
  return {
    rid,
    info: (e: string, d?: Record<string, unknown>) => emit("info", e, d),
    warn: (e: string, d?: Record<string, unknown>) => emit("warn", e, d),
    error: (e: string, d?: Record<string, unknown>) => emit("error", e, d),
  };
}

// Best-effort alert to a Slack-compatible incoming webhook (ALERT_WEBHOOK_URL secret).
// Use only for things a human must act on (e.g. a customer paid but was not upgraded).
export async function alert(title: string, details: Record<string, unknown> = {}): Promise<void> {
  const url = Deno.env.get("ALERT_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `:rotating_light: Biashara Yangu: ${title}\n\`\`\`${JSON.stringify(details)}\`\`\`` }),
      signal: AbortSignal.timeout(4000),
    });
  } catch { /* alerting must never break the request */ }
}
