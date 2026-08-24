import { db } from "@/lib/db";
import { ok, fail, handle } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const { seller } = await requireSeller();
    const messages = await db.supportMessage.findMany({
      where: { order: { items: { some: { product: { sellerId: seller.id } } } } },
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            items: { where: { product: { sellerId: seller.id } }, select: { title: true } },
          },
        },
      },
    });

    return ok({
      messages: messages.map((m) => ({
        id: m.id,
        fromName: m.fromName,
        fromEmail: m.fromEmail,
        subject: m.subject,
        body: m.body,
        resolved: m.resolved,
        createdAt: m.createdAt.toISOString(),
        orderNumber: m.order?.orderNumber ?? null,
        itemTitle: m.order?.items[0]?.title ?? null,
      })),
    });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? "");
    const resolved = Boolean(body.resolved);
    if (!id) return fail("id required.", 422);

    const message = await db.supportMessage.findFirst({
      where: { id, order: { items: { some: { product: { sellerId: seller.id } } } } },
    });
    if (!message) throw new ApiError(404, "Message not found.");

    await db.supportMessage.update({ where: { id }, data: { resolved } });
    return ok({ success: true });
  });
}
