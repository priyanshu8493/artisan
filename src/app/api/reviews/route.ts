import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const body = reviewSchema.parse(await readJson(req));

    // Verified purchase check
    let verified = false;
    if (body.orderItemId) {
      const orderItem = await db.orderItem.findUnique({
        where: { id: body.orderItemId },
        include: { order: true },
      });
      verified =
        !!orderItem &&
        orderItem.order.userId === sessionUser.id &&
        ["PROCESSING", "SHIPPED", "DELIVERED"].includes(orderItem.order.status);
    }

    const existingForOrderItem = body.orderItemId
      ? await db.review.findUnique({ where: { orderItemId: body.orderItemId } })
      : null;
    if (existingForOrderItem)
      return fail("You've already reviewed this item.", 409);

    const review = await db.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: body.productId,
          userId: sessionUser.id,
          orderItemId: verified ? body.orderItemId : null,
          rating: body.rating,
          title: body.title ?? null,
          body: body.body,
          photos: body.photos?.length ? JSON.stringify(body.photos) : null,
          verifiedPurchase: verified,
        },
      });
      const agg = await tx.review.aggregate({
        where: { productId: body.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.product.update({
        where: { id: body.productId },
        data: {
          ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          ratingCount: agg._count.rating,
        },
      });
      return created;
    });

    return ok({ review }, { status: 201 });
  });
}
