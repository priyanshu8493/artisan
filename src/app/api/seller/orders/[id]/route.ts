import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { sendEmail, shippingUpdateEmail } from "@/lib/email";

async function assertOwned(orderId: string) {
  const { seller } = await requireSeller();
  const order = await db.order.findFirst({
    where: { id: orderId, items: { some: { product: { sellerId: seller.id } } } },
    include: {
      items: { where: { product: { sellerId: seller.id } }, include: { product: { select: { slug: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      payments: true,
    },
  });
  if (!order) throw new ApiError(404, "Order not found.");
  return { seller, order };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const { order } = await assertOwned(id);
    return ok({
      order: {
        ...order,
        placedAt: order.placedAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    });
  });
}

/** Status update / internal note / refund */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const { seller, order } = await assertOwned(id);
    const body = await readJson<{
      op?: "status" | "note" | "refund";
      status?: string;
      message?: string;
      note?: string;
      reason?: string;
    }>(req);

    if (body.op === "status") {
      if (!body.status || !(ORDER_STATUSES as readonly string[]).includes(body.status))
        return fail("Invalid status.", 422);
      const message = body.message?.trim() || `Status changed to ${body.status.toLowerCase()}`;
      await db.$transaction([
        db.order.update({ where: { id }, data: { status: body.status } }),
        db.shipmentEvent.create({ data: { orderId: id, status: body.status, message } }),
        ...(order.userId
          ? [
              db.notification.create({
                data: {
                  userId: order.userId,
                  type: "ORDER",
                  title: `Order ${order.orderNumber} ${body.status.toLowerCase()}`,
                  body: message,
                  link: "/account/orders",
                },
              }),
            ]
          : []),
      ]);
      if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(body.status)) {
        await sendEmail({
          to: order.email,
          subject: `Order ${order.orderNumber}: ${body.status.toLowerCase()}`,
          html: shippingUpdateEmail({ orderNumber: order.orderNumber, status: body.status, message }),
        });
      }
      return ok({ success: true });
    }

    if (body.op === "note") {
      await db.order.update({
        where: { id },
        data: { internalNote: body.note?.slice(0, 2000) ?? null },
      });
      return ok({ success: true });
    }

    if (body.op === "refund") {
      if (!["CANCELLED", "REFUNDED"].includes(order.status))
        throw new ApiError(400, "Only cancelled/refunded orders can be refunded.");
      // Payment integration reserved — record refund intent on payments
      await db.payment.updateMany({
        where: { orderId: id },
        data: { status: "REFUNDED" },
      });
      await db.shipmentEvent.create({
        data: { orderId: id, status: "REFUNDED", message: `Refund issued${body.reason ? `: ${body.reason}` : ""}` },
      });
      void seller;
      return ok({ success: true });
    }

    return fail("Unknown operation.", 400);
  });
}
