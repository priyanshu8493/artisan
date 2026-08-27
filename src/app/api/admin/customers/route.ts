import { db } from "@/lib/db";
import { ok, handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const q = sp.get("q")?.trim().toLowerCase();

    const users = await db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true, reviews: true } } },
    });

    const filtered = q
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q)
        )
      : users;

    return ok({
      customers: filtered.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        region: u.region,
        marketingOptIn: u.marketingOptIn,
        createdAt: u.createdAt.toISOString(),
        orderCount: u._count.orders,
        reviewCount: u._count.reviews,
      })),
    });
  });
}
