import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { contactSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const body = contactSchema.parse(await readJson(req));
    await db.supportMessage.create({
      data: {
        fromName: body.name,
        fromEmail: body.email,
        subject: body.subject,
        body: body.body,
        orderId: body.orderId || null,
      },
    });
    return ok({ success: true }, { status: 201 });
  });
}
