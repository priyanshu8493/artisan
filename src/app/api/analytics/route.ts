import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ type?: string; productId?: string; sessionId?: string }>(req);
    if (!body.type || !["PRODUCT_VIEW", "ADD_TO_CART"].includes(body.type))
      return ok({ tracked: false });
    await db.analyticsEvent.create({
      data: {
        type: body.type,
        productId: body.productId || null,
        sessionId: body.sessionId || null,
      },
    });
    return ok({ tracked: true });
  });
}
