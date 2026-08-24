import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireSeller } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const { seller } = await requireSeller();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekAgo = new Date(now.getTime() - 7 * 864e5);

    // Orders containing this seller's products
    const sellerOrderItems = () => ({
      items: { some: { product: { sellerId: seller.id } } },
    });

    const [monthOrders, yearOrders, weekOrders, pendingCount, productCount, recentOrders, topProducts, lowStock, unreadNotifications] =
      await Promise.all([
        db.order.findMany({
          where: {
            ...sellerOrderItems(),
            status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
            placedAt: { gte: monthStart },
          },
          select: { totalCents: true },
        }),
        db.order.findMany({
          where: {
            ...sellerOrderItems(),
            status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
            placedAt: { gte: yearStart },
          },
          select: { totalCents: true },
        }),
        db.order.count({
          where: { ...sellerOrderItems(), placedAt: { gte: weekAgo } },
        }),
        db.order.count({ where: { ...sellerOrderItems(), status: "PENDING" } }),
        db.product.count({ where: { sellerId: seller.id } }),
        db.order.findMany({
          where: sellerOrderItems(),
          orderBy: { placedAt: "desc" },
          take: 8,
          include: {
            items: { where: { product: { sellerId: seller.id } }, include: { product: true } },
          },
        }),
        db.product.findMany({
          where: { sellerId: seller.id },
          orderBy: { salesCount: "desc" },
          take: 5,
          select: { id: true, title: true, slug: true, salesCount: true, priceCents: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
        }),
        db.product.findMany({
          where: {
            sellerId: seller.id,
            stock: { lte: seller.lowStockThreshold },
          },
          select: { id: true, title: true, stock: true },
        }),
        db.notification.count({ where: { userId: seller.userId, read: false } }),
      ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const ordersForChart = await db.order.findMany({
      where: {
        ...sellerOrderItems(),
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
        placedAt: { gte: sixMonthsAgo },
      },
      select: { totalCents: true, placedAt: true },
    });
    const monthlyRevenue = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyRevenue.set(d.toLocaleDateString("en-US", { month: "short" }), 0);
    }
    let runningDate = new Date(sixMonthsAgo);
    const monthKeys: { key: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < 6; i++) {
      monthKeys.push({
        key: runningDate.toLocaleDateString("en-US", { month: "short" }),
        start: new Date(runningDate),
        end: new Date(runningDate.getFullYear(), runningDate.getMonth() + 1, 1),
      });
      runningDate = new Date(runningDate.getFullYear(), runningDate.getMonth() + 1, 1);
    }
    for (const o of ordersForChart) {
      for (const mk of monthKeys) {
        if (o.placedAt >= mk.start && o.placedAt < mk.end) {
          monthlyRevenue.set(mk.key, (monthlyRevenue.get(mk.key) ?? 0) + Math.round(o.totalCents / 100));
        }
      }
    }

    return ok({
      stats: {
        monthRevenueCents: monthOrders.reduce((s, o) => s + o.totalCents, 0),
        yearRevenueCents: yearOrders.reduce((s, o) => s + o.totalCents, 0),
        ordersThisWeek: weekOrders,
        pendingOrders: pendingCount,
        productsListed: productCount,
      },
      monthlyRevenue: [...monthlyRevenue.entries()].map(([month, cents]) => ({ month, cents })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.shipFullName,
        placedAt: o.placedAt.toISOString(),
        status: o.status,
        itemsValueCents: o.items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id, title: p.title, slug: p.slug,
        salesCount: p.salesCount, priceCents: p.priceCents,
        imageUrl: p.images[0]?.url ?? null,
        revenueCents: p.salesCount * p.priceCents,
      })),
      lowStock,
      unreadNotifications,
    });
  });
}
