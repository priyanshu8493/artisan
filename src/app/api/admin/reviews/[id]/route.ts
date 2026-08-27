import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin, ApiError } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await requireAdmin();
    const review = await db.review.findUnique({ where: { id } });
    if (!review) throw new ApiError(404, "Review not found.");

    // Keep the product's aggregate ratings consistent
    await db.$transaction([
      db.review.delete({ where: { id } }),
      db.product.update({
        where: { id: review.productId },
        data: {
          ratingCount: { decrement: 1 },
          ratingAvg: await recomputeRating(review.productId, review.rating),
        },
      }),
    ]);
    return ok({ success: true });
  });
}

async function recomputeRating(productId: string, removedRating: number): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { ratingCount: true, ratingAvg: true },
  });
  if (!product) return 0;
  const remainingCount = Math.max(0, product.ratingCount - 1);
  if (remainingCount === 0) return 0;
  const oldTotal = product.ratingAvg * product.ratingCount;
  const newTotal = Math.max(0, oldTotal - removedRating);
  return Math.round((newTotal / remainingCount) * 10) / 10;
}
