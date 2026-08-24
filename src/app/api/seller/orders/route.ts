import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { sendEmail, shippingUpdateEmail } from "@/lib/email";

export async function GET(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim().toLowerCase();
    const sort = sp.get("sort") ?? "newest";

    const orders = await db.order.findMany({
      where: {
        items: { some: { product: { sellerId: seller.id } } },
        ...(status && ORDER_STATUSES.includes(status as any) ? { status } : {}),
      },
      orderBy: { placedAt: sort === "oldest" ? "asc" : "desc" },
      include: {
        items: { where: { product: { sellerId: seller.id } } },
      },
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

/** Bulk status update */
export async function PUT(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const status = String(body.status ?? "");
    if (!ids.length || !(ORDER_STATUSES as readonly string[]).includes(status))
      throw new ApiError(422, "Provide order ids and a valid status.");

    // Verify all orders contain this seller's products
    const valid = await db.order.count({
      where: { id: { in: ids }, items: { some: { product: { sellerId: seller.id } } } },
    });
    if (valid !== ids.length) throw new ApiError(403, "Some orders are not yours.");

    await Promise.all(
      ids.map((id) =>
        db.$transaction([
          db.order.update({ where: { id }, data: { status } }),
          db.shipmentEvent.create({ data: { orderId: id, status, message: `Marked ${status.toLowerCase()} by maker` } }),
        ])
      )
    );
    return ok({ success: true });
  });
}
