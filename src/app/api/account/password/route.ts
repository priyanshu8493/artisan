import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireUser, verifyPassword, hashPassword } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const body = passwordChangeSchema.parse(await readJson(req));
    const user = await db.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return fail("Account not found.", 404);
    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) return fail("Your current password is incorrect.", 403);
    await db.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });
    return ok({ success: true });
  });
}
