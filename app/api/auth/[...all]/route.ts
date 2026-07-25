import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { enforceRateLimit } from "@/lib/rate-limit-response";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "auth-get", 60);
  if (limited) return limited;
  return handlers.GET(request);
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "auth-post", 30);
  if (limited) return limited;
  return handlers.POST(request);
}
