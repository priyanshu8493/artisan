import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireUser, ApiError } from "@/lib/auth";
import { addressSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const addresses = await db.address.findMany({
      where: { userId: sessionUser.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
    return ok({ addresses });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const body = addressSchema.parse(await readJson(req));
    if (body.isDefault)
      await db.address.updateMany({
        where: { userId: sessionUser.id },
        data: { isDefault: false },
      });
    const count = await db.address.count({ where: { userId: sessionUser.id } });
    const address = await db.address.create({
      data: { ...body, userId: sessionUser.id, isDefault: body.isDefault || count === 0 },
    });
    return ok({ address }, { status: 201 });
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new ApiError(400, "Address id required.");
    const existing = await db.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== sessionUser.id)
      throw new ApiError(404, "Address not found.");
    await db.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await db.address.findFirst({ where: { userId: sessionUser.id } });
      if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return ok({ success: true });
  });
}
