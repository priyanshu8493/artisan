import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";

async function assertExists(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found.");
  return user;
}

/** Update marketingOptIn or region for a customer */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    await assertExists(id);
    const body = await readJson<{ op?: "marketing" | "region"; value?: any }>(req);

    if (body.op === "marketing") {
      await db.user.update({ where: { id }, data: { marketingOptIn: !!body.value } });
      return ok({ success: true });
    }
    if (body.op === "region") {
      if (!["US", "GB"].includes(body.value)) return fail("Invalid region.", 422);
      await db.user.update({ where: { id }, data: { region: body.value } });
      return ok({ success: true });
    }
    return fail("Unknown operation.", 400);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const user = await assertExists(id);
    if (id === (await requireAdmin()).id)
      throw new ApiError(400, "You cannot delete your own account.");
    await db.user.delete({ where: { id } });
    void user;
    return ok({ success: true });
  });
}
