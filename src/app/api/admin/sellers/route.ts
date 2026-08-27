import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const sellers = await db.sellerProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true, createdAt: true } },
        _count: { select: { products: true } },
      },
    });

    return ok({
      sellers: sellers.map((s) => ({
        id: s.id,
        shopName: s.shopName,
        slug: s.slug,
        tagline: s.tagline,
        city: s.city,
        country: s.country,
        featured: s.featured,
        logoUrl: s.logoUrl,
        email: s.user.email,
        ownerName: s.user.name,
        joinedAt: s.user.createdAt.toISOString(),
        productCount: s._count.products,
      })),
    });
  });
}
