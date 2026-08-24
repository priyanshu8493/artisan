import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { ApiError } from "@/lib/auth";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ code?: string; subtotalCents?: number }>(req);
    const code = body.code?.trim().toUpperCase();
    const subtotal = Number(body.subtotalCents);
    if (!code) return fail("Enter a discount code.", 422);
    if (!Number.isFinite(subtotal)) return fail("Invalid cart.", 422);

    const coupon = await db.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active || (coupon.expiresAt && coupon.expiresAt < new Date()))
      throw new ApiError(404, "This code isn't valid.");
    if (subtotal < coupon.minSubtotalCents)
      throw new ApiError(
        400,
        `Spend at least $${(coupon.minSubtotalCents / 100).toFixed(0)} to use this code.`
      );

    let discountCents = 0;
    if (coupon.percentOff) discountCents = Math.round((subtotal * coupon.percentOff) / 100);
    if (coupon.amountOffCents) discountCents = Math.min(coupon.amountOffCents, subtotal);

    return ok({
      code: coupon.code,
      percentOff: coupon.percentOff ?? null,
      amountOffCents: coupon.amountOffCents ?? null,
      discountCents,
    });
  });
}
