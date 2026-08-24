import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";
import { sellerResponseSchema } from "@/lib/validators";

export async function GET(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const ratingFilter = Number(new URL(req.url).searchParams.get("rating") ?? "") || null;

    const reviews = await db.review.findMany({
      where: { product: { sellerId: seller.id } },
      orderBy: [{ flagged: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, title: true, slug: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      },
    });

    const filtered = ratingFilter ? reviews.filter((r) => r.rating === ratingFilter) : reviews;

    return ok({
      reviews: filtered.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        flagged: r.flagged,
        verifiedPurchase: r.verifiedPurchase,
        sellerResponse: r.sellerResponse,
        respondedAt: r.respondedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        userName: r.user.name,
        product: { id: r.product.id, title: r.product.title, slug: r.product.slug, imageUrl: r.product.images[0]?.url ?? null },
      })),
    });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = await readJson<{
      reviewId?: string;
      op?: "respond" | "flag";
      response?: string;
      flagged?: boolean;
    }>(req);

    if (!body.reviewId) return fail("reviewId required.", 422);

    // Ownership check
    const review = await db.review.findFirst({
      where: { id: body.reviewId, product: { sellerId: seller.id } },
    });
    if (!review) throw new ApiError(404, "Review not found.");

    if (body.op === "respond") {
      const parsed = sellerResponseSchema.parse({ response: body.response });
      await db.review.update({
        where: { id: body.reviewId },
        data: { sellerResponse: parsed.response, respondedAt: new Date() },
      });
      return ok({ success: true });
    }

    if (body.op === "flag") {
      await db.review.update({
        where: { id: body.reviewId },
        data: { flagged: body.flagged ?? !review.flagged },
      });
      return ok({ success: true });
    }

    return fail("Unknown operation.", 400);
  });
}
