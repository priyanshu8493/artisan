import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const sessionUser = await requireUser();
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true, email: true, name: true, phone: true, role: true, region: true,
        marketingOptIn: true, orderUpdatesOptIn: true, createdAt: true,
        sellerProfile: true,
      },
    });
    return ok({ user });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const sessionUser = await requireUser();
    const body = profileSchema.parse(await readJson(req));
    const user = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        name: body.name,
        phone: body.phone || null,
        region: body.region,
        marketingOptIn: body.marketingOptIn,
        orderUpdatesOptIn: body.orderUpdatesOptIn,
      },
      select: { id: true, email: true, name: true, role: true, region: true },
    });
    return ok({ user });
  });
}
