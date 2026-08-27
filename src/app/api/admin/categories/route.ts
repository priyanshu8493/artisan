import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";
import { z } from "zod";
import { uniqueSlug } from "@/lib/utils";

const categoryInput = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().max(90).regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only").optional().or(z.literal("")),
  description: z.string().max(300).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return ok({ categories });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = categoryInput.parse(await readJson(req));
    const slug = body.slug ? body.slug : uniqueSlug(body.name);
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) throw new ApiError(422, "A category with that slug already exists.");

    const sortOrder = body.sortOrder ?? (await db.category.count());
    const category = await db.category.create({
      data: {
        name: body.name, slug, description: body.description || null,
        imageUrl: body.imageUrl || null, sortOrder,
      },
    });
    return ok({ category }, { status: 201 });
  });
}
