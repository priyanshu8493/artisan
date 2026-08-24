import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const sp = url.searchParams;

    const q = sp.get("q")?.trim();
    const category = sp.get("category");
    const materials = sp.get("materials");
    const color = sp.get("color");
    const origin = sp.get("origin");
    const seller = sp.get("seller"); // artisan slug
    const minPrice = Number(sp.get("minPrice") ?? "") || undefined; // USD cents
    const maxPrice = Number(sp.get("maxPrice") ?? "") || undefined;
    const sort = sp.get("sort") ?? "trending";
    const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      ...(category && { category: { is: { slug: category } } }),
      ...(seller && { seller: { is: { slug: seller } } }),
      ...(origin && { originCountry: origin }),
      ...(color && { color: { contains: color } }),
      ...(materials && { materials: { contains: materials } }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        priceCents: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      }),
      ...(q && {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { keywords: { contains: q } },
          { materials: { contains: q } },
          { seller: { is: { shopName: { contains: q } } } },
        ],
      }),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case "newest": orderBy = { createdAt: "desc" }; break;
      case "price_asc": orderBy = { priceCents: "asc" }; break;
      case "price_desc": orderBy = { priceCents: "desc" }; break;
      case "rating": orderBy = { ratingAvg: "desc" }; break;
      case "bestsellers": orderBy = { salesCount: "desc" }; break;
      default: orderBy = { salesCount: "desc" };
    }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          seller: { select: { shopName: true, slug: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      }),
    ]);

    return ok({
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents,
        imageUrl: p.images[0]?.url ?? null,
        sellerName: p.seller.shopName,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        stock: p.stock,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  });
}
