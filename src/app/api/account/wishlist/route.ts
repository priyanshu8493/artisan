import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const items = await db.wishlistItem.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            seller: { select: { shopName: true } },
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
        },
      },
    });
    return ok({
      productIds: items.map((w) => w.productId),
      products: items
        .filter((w) => w.product.status === "ACTIVE")
        .map((w) => ({
          id: w.product.id,
          slug: w.product.slug,
          title: w.product.title,
          priceCents: w.product.priceCents,
          compareAtCents: w.product.compareAtCents,
          imageUrl: w.product.images[0]?.url ?? null,
          sellerName: w.product.seller.shopName,
          ratingAvg: w.product.ratingAvg,
          ratingCount: w.product.ratingCount,
          stock: w.product.stock,
        })),
    });
  });
}

/** Toggle a product in the wishlist */
export async function POST(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const { productId } = await readJson<{ productId?: string }>(req);
    if (!productId) return ok({ error: "productId required" }, { status: 422 });

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: sessionUser.id, productId } },
    });
    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return ok({ saved: false });
    }
    await db.wishlistItem.create({ data: { userId: sessionUser.id, productId } });
    return ok({ saved: true });
  });
}
