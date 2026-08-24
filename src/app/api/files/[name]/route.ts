import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Serves files stored in the temp upload dir by /api/uploads.
 * Path-traversal safe: names must match [A-Za-z0-9._-]+ and resolve
 * inside the uploads directory.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return new Response("Not found", { status: 404 });
  }

  const dir = join(tmpdir(), "artisan-uploads");
  const filePath = join(dir, name);
  if (!filePath.startsWith(dir)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const type = TYPES[ext];
    if (!type) return new Response("Unsupported media type", { status: 415 });

    const data = await readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
