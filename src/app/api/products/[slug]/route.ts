import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handle(async () => {
    const { slug } = await params;
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        seller: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });
    if (!product || product.status !== "ACTIVE") return fail("Product not found.", 404);
    return ok({ product });
  });
}
