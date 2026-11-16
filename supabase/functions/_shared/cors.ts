// Shared CORS policy: only the app's own origins may call the functions from a browser.
// Requests are also authenticated with the user's JWT; CORS is defense in depth.
// Add more origins (comma separated) with the ALLOWED_ORIGINS function secret.
const EXACT = [
  "https://www.biashara-yangu.co.tz",
  "https://biashara-yangu.co.tz",
  "capacitor://localhost",   // iOS app
  "https://localhost",       // Android app (Capacitor default scheme)
  "http://localhost",
  "http://localhost:8080",   // local development
];

const PATTERNS = [
  /^https:\/\/biashara-yangu[a-z0-9-]*\.(vercel\.app|lovable\.app)$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];

export function corsFor(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const extra = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = EXACT.includes(origin) || extra.includes(origin) || PATTERNS.some((p) => p.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin : EXACT[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    "Vary": "Origin",
  };
}
