import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";

export async function GET() {
  return handle(async () => {
    await requireAdmin();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekAgo = new Date(now.getTime() - 7 * 864e5);

    const [
      monthOrders,
      yearOrders,
      weekOrders,
      pendingOrders,
      productCount,
      sellerCount,
      customerCount,
      userCount,
      reviewCount,
      pendingSupport,
      recentOrders,
      lowStock,
      topProducts,
    ] = await Promise.all([
      db.order.findMany({
        where: { status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] }, placedAt: { gte: monthStart } },
        select: { totalCents: true },
      }),
      db.order.findMany({
        where: { status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] }, placedAt: { gte: yearStart } },
        select: { totalCents: true },
      }),
      db.order.count({ where: { placedAt: { gte: weekAgo } } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.product.count(),
      db.sellerProfile.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count(),
      db.review.count(),
      db.supportMessage.count({ where: { resolved: false } }),
      db.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 8,
        include: { items: true },
      }),
      db.product.findMany({
        where: { status: "ACTIVE", stock: { lte: 3 } },
        orderBy: { stock: "asc" },
        take: 6,
        select: { id: true, title: true, stock: true },
      }),
      db.product.findMany({
        orderBy: { salesCount: "desc" },
        take: 5,
        select: {
          id: true, title: true, slug: true, salesCount: true, priceCents: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      }),
    ]);

    // Order status breakdown
    const statusCounts = await db.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const statusBreakdown = Object.fromEntries(
      ORDER_STATUSES.map((s) => [s, 0] as const)
    ) as Record<string, number>;
    for (const row of statusCounts) statusBreakdown[row.status] = row._count._all;

    // Monthly revenue for the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const ordersForChart = await db.order.findMany({
      where: {
        status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
        placedAt: { gte: sixMonthsAgo },
      },
      select: { totalCents: true, placedAt: true },
    });
    const monthly = new Map<string, number>();
    const monthKeys: { key: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push({
        key: d.toLocaleDateString("en-US", { month: "short" }),
        start: new Date(d),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      });
      monthly.set(monthKeys[i].key, 0);
    }
    for (const o of ordersForChart) {
      for (const mk of monthKeys) {
        if (o.placedAt >= mk.start && o.placedAt < mk.end) {
          monthly.set(mk.key, (monthly.get(mk.key) ?? 0) + Math.round(o.totalCents / 100));
        }
      }
    }

    return ok({
      stats: {
        monthRevenueCents: monthOrders.reduce((s, o) => s + o.totalCents, 0),
        yearRevenueCents: yearOrders.reduce((s, o) => s + o.totalCents, 0),
        ordersThisWeek: weekOrders,
        pendingOrders,
        productsListed: productCount,
        sellers: sellerCount,
        customers: customerCount,
        users: userCount,
        reviews: reviewCount,
        pendingSupport,
      },
      statusBreakdown,
      monthlyRevenue: [...monthly.entries()].map(([month, cents]) => ({ month, cents })),
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
    });
  });
}
