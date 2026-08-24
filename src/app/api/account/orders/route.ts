import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const orders = await db.order.findMany({
      where: { userId: sessionUser.id },
      orderBy: { placedAt: "desc" },
      include: { items: true, events: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return ok({ orders });
  });
}

/** Reorder support: returns the items still available */
export async function POST(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const { orderId } = await req.json().catch(() => ({ orderId: null }));
    if (!orderId) return ok({ error: "orderId required" }, { status: 400 });
    const order = await db.order.findFirst({
      where: { id: orderId, userId: sessionUser.id },
      include: { items: { include: { product: { include: { images: { take: 1 } } } } } },
    });
    if (!order) return ok({ error: "Order not found" }, { status: 404 });
    return ok({
      items: order.items.map((i) => ({
        productId: i.productId,
        slug: i.product.slug,
        title: i.title,
        imageUrl: i.product.images[0]?.url ?? "",
        priceCents: i.unitPriceCents,
        variantId: i.variantId ?? null,
        variantName: i.variantName ?? null,
        quantity: i.quantity,
        maxStock: Math.min(i.product.stock + i.quantity, 99),
        available: i.product.stock > 0 && i.product.status === "ACTIVE",
      })),
    });
  });
}
