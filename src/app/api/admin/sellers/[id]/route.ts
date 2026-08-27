import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";

async function assertExists(profileId: string) {
  const seller = await db.sellerProfile.findUnique({ where: { id: profileId } });
  if (!seller) throw new ApiError(404, "Seller not found.");
  return seller;
}

/** Toggle a seller's featured flag */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const seller = await assertExists(id);
    const body = await readJson<{ op?: "featured"; featured?: boolean }>(req);
    if (body.op === "featured") {
      await db.sellerProfile.update({ where: { id }, data: { featured: !!body.featured } });
      return ok({ success: true });
    }
    void seller;
    return fail("Unknown operation.", 400);
  });
}
