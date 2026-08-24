import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const reviews = await db.review.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { slug: true, title: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });
    return ok({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        sellerResponse: r.sellerResponse,
        verifiedPurchase: r.verifiedPurchase,
        createdAt: r.createdAt.toISOString(),
        product: { slug: r.product.slug, title: r.product.title, images: r.product.images },
      })),
    });
  });
}
