import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const notifications = await db.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const unread = notifications.filter((n) => !n.read).length;
    return ok({ notifications, unread });
  });
}

/** Mark all or one as read */
export async function PATCH(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const { id } = await req.json().catch(() => ({ id: null }));
    await db.notification.updateMany({
      where: { userId: sessionUser.id, ...(id ? { id } : {}) },
      data: { read: true },
    });
    return ok({ success: true });
  });
}
