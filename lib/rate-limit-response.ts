import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs = 60_000
): NextResponse | null {
  const key = `${scope}:${clientIp(request)}`;
  const result = rateLimit({ key, limit, windowMs });
  if (result.allowed) return null;

  return NextResponse.json(
    { message: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000) || 1),
      },
    }
  );
}
