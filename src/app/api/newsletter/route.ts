import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  return handle(async () => {
    const rl = rateLimit(`newsletter:${clientIp(req)}`, 5, 60_000);
    if (!rl.ok) return fail("Too many requests — please slow down.", 429);
    const { email } = await req.json().catch(() => ({ email: "" }));
    if (!email || typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return fail("Enter a valid email address.", 422);
    await db.newsletterSubscriber.upsert({
      where: { email: email.toLowerCase() },
      create: { email: email.toLowerCase() },
      update: {},
    });
    return ok({ success: true }, { status: 201 });
  });
}
