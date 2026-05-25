import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "compliance-monitor",
  });
}

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (!ratelimit) return { allowed: true, remaining: 999 };

  const { success, remaining } = await ratelimit.limit(userId);
  return { allowed: success, remaining };
}
