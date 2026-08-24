import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireSeller } from "@/lib/auth";

export async function GET(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const sp = new URL(req.url).searchParams;
    const period = sp.get("period") ?? "30d"; // 7d | 30d | 90d | year | all
    const customFrom = sp.get("from");
    const customTo = sp.get("to");

    let start: Date | undefined;
    const now = new Date();
    if (customFrom) {
      start = new Date(customFrom);
      const end = customTo ? new Date(customTo) : now;
      end.setHours(23, 59, 59);
      return computeRange(seller.id, start, end, true);
    }
    switch (period) {
      case "7d": start = new Date(now.getTime() - 7 * 864e5); break;
      case "90d": start = new Date(now.getTime() - 90 * 864e5); break;
      case "year": start = new Date(now.getFullYear(), 0, 1); break;
      case "all": start = new Date(0); break;
      default: start = new Date(now.getTime() - 30 * 864e5);
    }
    return computeRange(seller.id, start, now, false);
  });
}

async function computeRange(sellerId: string, start: Date, end: Date, dailyBuckets: boolean) {
  const orders = await db.order.findMany({
    where: {
      items: { some: { product: { sellerId } } },
      status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      placedAt: { gte: start, lte: end },
    },
    select: { totalCents: true, placedAt: true, items: { where: { product: { sellerId } }, select: { quantity: true, unitPriceCents: true } } },
  });

  const itemsSold = orders.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);
  const revenueCents = orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.unitPriceCents * i.quantity, 0), 0);

  // Daily series
  const seriesMap = new Map<string, number>();
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / 864e5) || 1;
  const useDaily = dailyBuckets || dayCount <= 120;
  if (useDaily) {
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      seriesMap.set(d.toISOString().slice(5, 10), 0);
    }
    for (const o of orders) {
      for (const item of o.items) {
        const key = o.placedAt.toISOString().slice(5, 10);
        if (seriesMap.has(key))
          seriesMap.set(key, (seriesMap.get(key) ?? 0) + Math.round(item.unitPriceCents * item.quantity / 100));
      }
    }
  }

  // Funnel
  const [views, carts] = await Promise.all([
    db.analyticsEvent.count({ where: { type: "PRODUCT_VIEW", product: { sellerId }, createdAt: { gte: start, lte: end } } }),
    db.analyticsEvent.count({ where: { type: "ADD_TO_CART", product: { sellerId }, createdAt: { gte: start, lte: end } } }),
  ]);
  const purchases = orders.length;

  // Top products
  const topProductsRaw = await db.product.findMany({
    where: { sellerId },
    orderBy: { salesCount: "desc" },
    take: 8,
    select: { id: true, title: true, slug: true, priceCents: true, salesCount: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  // New customers (first order in range)
  const customersInPeriod = new Set(
    (await db.order.findMany({
      where: { items: { some: { product: { sellerId } } }, placedAt: { gte: start, lte: end } },
      select: { email: true },
    })).map((o) => o.email)
  );
  const returningCustomers = new Set(
    (await db.order.findMany({
      where: { items: { some: { product: { sellerId } } }, placedAt: { lt: start } },
      select: { email: true },
    })).map((o) => o.email)
  );
  const newCustomers = [...customersInPeriod].filter((e) => !returningCustomers.has(e)).length;

  return ok({
    summary: {
      revenueCents,
      orderCount: orders.length,
      itemsSold,
      avgOrderValueCents: orders.length ? Math.round(revenueCents / orders.length) : 0,
      newCustomers,
      repeatCustomers: [...customersInPeriod].filter((e) => returningCustomers.has(e)).length,
      conversionRate:
        views > 0 ? Math.round((purchases / views) * 1000) / 10 : 0,
    },
    funnel: { views, carts, purchases },
    series: [...seriesMap.entries()].map(([date, cents]) => ({ date, cents })),
    topProducts: topProductsRaw.map((p) => ({
      id: p.id, title: p.title, slug: p.slug,
      salesCount: p.salesCount,
      revenueCents: p.salesCount * p.priceCents,
      imageUrl: p.images[0]?.url ?? null,
    })),
  });
}
