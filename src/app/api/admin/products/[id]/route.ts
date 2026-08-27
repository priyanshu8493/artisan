import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";

async function assertExists(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { seller: { select: { userId: true, shopName: true } } },
  });
  if (!product) throw new ApiError(404, "Product not found.");
  return product;
}

/** Quick admin updates: status toggle, featured toggle */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const product = await assertExists(id);
    const body = await readJson<{
      op?: "status" | "featured";
      status?: string;
      featured?: boolean;
    }>(req);

    if (body.op === "status") {
      if (!body.status || !["DRAFT", "ACTIVE", "INACTIVE"].includes(body.status))
        return fail("Invalid status.", 422);
      await db.product.update({ where: { id }, data: { status: body.status } });
      return ok({ success: true });
    }

    if (body.op === "featured") {
      await db.product.update({ where: { id }, data: { featured: !!body.featured } });
      return ok({ success: true });
    }

    void product;
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
    await assertExists(id);
    try {
      await db.product.delete({ where: { id } });
    } catch {
      // Referenced by orders — soft delete
      await db.product.update({ where: { id }, data: { status: "INACTIVE", featured: false } });
      return ok({ success: true, softDeleted: true });
    }
    return ok({ success: true });
  });
}
