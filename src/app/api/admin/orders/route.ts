import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim().toLowerCase();
    const sort = sp.get("sort") ?? "newest";

    const orders = await db.order.findMany({
      where: {
        ...(status && (ORDER_STATUSES as readonly string[]).includes(status) ? { status } : {}),
      },
      orderBy: { placedAt: sort === "oldest" ? "asc" : "desc" },
      include: { items: true },
    });

    const filtered = q
      ? orders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.shipFullName.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q)
        )
      : orders;

    return ok({
      orders: filtered.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.shipFullName,
        email: o.email,
        placedAt: o.placedAt.toISOString(),
        status: o.status,
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        itemsValueCents: o.items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
        shippingMethod: o.shippingMethod,
      })),
    });
  });
}
