import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim();

    const products = await db.product.findMany({
      where: {
        ...(status && ["DRAFT", "ACTIVE", "INACTIVE"].includes(status) ? { status } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { sku: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        seller: { select: { shopName: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
      },
    });

    return ok({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        status: p.status,
        featured: p.featured,
        priceCents: p.priceCents,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        categoryName: p.category.name,
        sellerName: p.seller.shopName,
        imageUrl: p.images[0]?.url ?? null,
        salesCount: p.salesCount,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        variantCount: p.variants.length,
        variantStock: p.variants.reduce((n, v) => n + v.stock, 0),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  });
}
