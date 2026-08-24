import { destroySessionCookie } from "@/lib/auth";
import { ok, handle } from "@/lib/api";

export async function POST() {
  return handle(async () => {
    await destroySessionCookie();
    return ok({ success: true });
  });
}
