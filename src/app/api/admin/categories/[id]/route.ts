import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";
import { z } from "zod";

const categoryInput = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().max(90).regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only").optional().or(z.literal("")),
  description: z.string().max(300).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Category not found.");
    const body = categoryInput.parse(await readJson(req));

    const slug = body.slug || existing.slug;
    const dup = await db.category.findFirst({ where: { slug, NOT: { id } } });
    if (dup) throw new ApiError(422, "A category with that slug already exists.");

    const category = await db.category.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        sortOrder: body.sortOrder,
      },
    });
    return ok({ category });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw new ApiError(404, "Category not found.");
    if (existing._count.products > 0)
      throw new ApiError(422, "Cannot delete a category that still has products.");

    await db.category.delete({ where: { id } });
    return ok({ success: true });
  });
}
