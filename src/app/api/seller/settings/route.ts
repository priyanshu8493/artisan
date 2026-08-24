import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";
import { z } from "zod";

const settingsSchema = z.object({
  shopName: z.string().min(2).max(80),
  tagline: z.string().max(140).optional().nullable(),
  bio: z.string().max(4000).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  country: z.enum(["US", "GB"]).default("US"),
  returnPolicy: z.string().max(2000).optional().nullable(),
  shippingPolicy: z.string().max(2000).optional().nullable(),
  lowStockThreshold: z.number().int().min(0).max(999).default(3),
  payoutDetails: z.string().max(500).optional().nullable(),
});

export async function GET() {
  return handle(async () => {
    const { user, seller } = await requireSeller();
    return ok({ seller, email: user.email });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = settingsSchema.parse(await readJson(req));
    const updated = await db.sellerProfile.update({
      where: { id: seller.id },
      data: {
        shopName: body.shopName,
        tagline: body.tagline || null,
        bio: body.bio || null,
        logoUrl: body.logoUrl || null,
        bannerUrl: body.bannerUrl || null,
        city: body.city || null,
        country: body.country,
        returnPolicy: body.returnPolicy || null,
        shippingPolicy: body.shippingPolicy || null,
        lowStockThreshold: body.lowStockThreshold,
        // Payout details would be handled via Stripe Connect onboarding — stored as placeholder
        ...(body.payoutDetails !== undefined ? { payoutDetails: body.payoutDetails } : {}),
      },
    });
    void updated;
    return ok({ success: true });
  });
}

/** Bulk CSV inventory upload: [{ sku, stock }] */
export async function POST(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = await readJson<{ rows?: { sku?: string; stock?: number }[] }>(req);
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 500) : [];
    let updatedCount = 0;
    for (const row of rows) {
      if (!row.sku || typeof row.stock !== "number") continue;
      const product = await db.product.findFirst({ where: { sellerId: seller.id, sku: row.sku } });
      if (!product) continue;
      await db.$transaction([
        db.product.update({
          where: { id: product.id },
          data: { stock: Math.max(0, Math.trunc(row.stock)) },
        }),
        db.stockLog.create({
          data: {
            productId: product.id,
            delta: Math.max(0, Math.trunc(row.stock)) - product.stock,
            reason: "ADJUSTMENT",
            note: "CSV bulk update",
          },
        }),
      ]);
      updatedCount++;
    }
    if (updatedCount === 0 && rows.length > 0)
      throw new ApiError(404, "No products matched the provided SKUs.");
    return ok({ updatedCount });
  });
}
