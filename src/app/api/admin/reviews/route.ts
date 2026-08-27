import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";
import { sellerResponseSchema } from "@/lib/validators";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const ratingFilter = Number(new URL(req.url).searchParams.get("rating") ?? "") || null;
    const flaggedOnly = new URL(req.url).searchParams.get("flagged") === "1";

    const reviews = await db.review.findMany({
      where: flaggedOnly ? { flagged: true } : {},
      orderBy: [{ flagged: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        product: {
          select: {
            id: true, title: true, slug: true,
            seller: { select: { shopName: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        },
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
        userEmail: r.user.email,
        sellerName: r.product.seller.shopName,
        product: { id: r.product.id, title: r.product.title, slug: r.product.slug, imageUrl: r.product.images[0]?.url ?? null },
      })),
    });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await readJson<{
      reviewId?: string;
      op?: "flag" | "respond";
      flagged?: boolean;
      response?: string;
    }>(req);

    if (!body.reviewId) return fail("reviewId required.", 422);
    const review = await db.review.findUnique({ where: { id: body.reviewId } });
    if (!review) throw new ApiError(404, "Review not found.");

    if (body.op === "flag") {
      await db.review.update({
        where: { id: body.reviewId },
        data: { flagged: body.flagged ?? !review.flagged },
      });
      return ok({ success: true });
    }

    if (body.op === "respond") {
      const parsed = sellerResponseSchema.parse({ response: body.response });
      await db.review.update({
        where: { id: body.reviewId },
        data: { sellerResponse: parsed.response, respondedAt: new Date() },
      });
      return ok({ success: true });
    }

    return fail("Unknown operation.", 400);
  });
}
