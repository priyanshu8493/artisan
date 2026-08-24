import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { verifyPassword, createSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  return handle(async () => {
    const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
    if (!rl.ok) return fail(`Too many attempts. Try again in ${rl.retryAfterSec}s.`, 429);
    const body = loginSchema.parse(await readJson(req));
    const email = body.email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return fail("Invalid email or password.", 401);
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) return fail("Invalid email or password.", 401);
    await createSessionCookie(user.id, user.role);
    return ok({ id: user.id, role: user.role, name: user.name });
  });
}
