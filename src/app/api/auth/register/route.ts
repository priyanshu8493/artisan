import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { hashPassword, createSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { slugify, uniqueSlug } from "@/lib/utils";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  return handle(async () => {
    const rl = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000);
    if (!rl.ok) return fail(`Too many sign-up attempts. Try again in ${rl.retryAfterSec}s.`, 429);
    const body = registerSchema.parse(await readJson(req));
    const email = body.email.toLowerCase().trim();

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return fail("An account with this email already exists.", 409);

    if (body.role === "SELLER" && !body.shopName)
      return fail("Shop name is required for seller accounts.", 422);

    const passwordHash = await hashPassword(body.password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: body.name.trim(),
        role: body.role,
        sellerProfile:
          body.role === "SELLER"
            ? {
                create: {
                  shopName: body.shopName!.trim(),
                  slug: uniqueSlug(body.shopName!),
                  country: "US",
                },
              }
            : undefined,
      },
      select: { id: true, role: true },
    });

    await createSessionCookie(user.id, user.role);
    await sendEmail({ to: email, subject: "Welcome to Artisan Market", html: welcomeEmail(body.name) });
    return ok({ id: user.id, role: user.role }, { status: 201 });
  });
}
