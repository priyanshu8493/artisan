import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ok, fail, handle } from "@/lib/api";
import { requireSeller } from "@/lib/auth";
import { randomUUID } from "node:crypto";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "video/mp4", "video/webm"];

/**
 * Upload storage. Writes to the OS temp dir (works on read-only serverless
 * filesystems like Vercel) and serves files back through /api/files/[name].
 * Swap this handler for S3/Cloudinary in production — the API contract stays
 * the same: multipart form → { url }. Temp files are ephemeral per instance.
 */
export async function POST(req: Request) {
  return handle(async () => {
    await requireSeller();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file provided.", 422);
    if (!ALLOWED.includes(file.type)) return fail(`Unsupported file type: ${file.type}`, 415);
    if (file.size > MAX_SIZE) return fail("File exceeds the 8MB limit.", 413);

    const ext =
      file.type === "image/jpeg" ? "jpg"
      : file.type === "image/png" ? "png"
      : file.type === "image/webp" ? "webp"
      : file.type === "image/svg+xml" ? "svg"
      : file.type === "video/mp4" ? "mp4"
      : "webm";

    const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const dir = join(tmpdir(), "artisan-uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, name), buffer);

    return ok({ url: `/api/files/${name}` }, { status: 201 });
  });
}
