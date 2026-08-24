import { db } from "@/lib/db";
import { ok, fail, handle, readJson } from "@/lib/api";
import { requireSeller, ApiError } from "@/lib/auth";
import { productSchema } from "@/lib/validators";

async function assertOwned(productId: string) {
  const { seller } = await requireSeller();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.sellerId !== seller.id)
    throw new ApiError(404, "Product not found.");
  return { seller, product };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const { product } = await assertOwned(id);
    const full = await db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        stockLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    return ok({ product: full ?? product });
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await assertOwned(id);
    const body = productSchema.parse(await readJson(req));

    // Replace images & variants wholesale (simple + predictable)
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: id } }),
      db.productVariant.deleteMany({ where: { productId: id } }),
      db.product.update({
        where: { id },
        data: {
          categoryId: body.categoryId,
          title: body.title,
          slug: body.slug || undefined,
          description: body.description,
          story: body.story || null,
          sku: body.sku || "",
          priceCents: body.priceCents,
          compareAtCents: body.compareAtCents ?? null,
          materials: body.materials || null,
          color: body.color || null,
          dimensions: body.dimensions || null,
          weightGrams: body.weightGrams ?? null,
          careInstructions: body.careInstructions || null,
          originCountry: body.originCountry ?? null,
          lowStockThreshold: body.lowStockThreshold,
          status: body.status,
          featured: body.featured,
          videoUrl: body.videoUrl || null,
          metaTitle: body.metaTitle || null,
          metaDescription: body.metaDescription || null,
          keywords: body.keywords || null,
          isDraftSaved: false,
        },
      }),
      db.product.update({
        where: { id },
        data: {
          images: {
            create: body.images.map((img, i) => ({
              url: img.url,
              alt: img.alt ?? null,
              sortOrder: i,
            })),
          },
        },
      }),
      db.product.update({
        where: { id },
        data: {
          variants: {
            create: body.variants.map((v) => ({
              name: v.name,
              optionSize: v.optionSize || null,
              optionColor: v.optionColor || null,
              optionMaterial: v.optionMaterial || null,
              priceDeltaCents: v.priceDeltaCents,
              stock: v.stock,
              sku: v.sku || null,
            })),
          },
        },
      }),
    ]);

    return ok({ success: true });
  });
}

/** Quick updates without full validation: status toggle, stock adjust */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    const { seller, product } = await assertOwned(id);
    const body = await readJson<{
      op?: "status" | "stock" | "duplicate";
      status?: string;
      delta?: number;
      note?: string;
    }>(req);

    if (body.op === "status") {
      if (!body.status || !["DRAFT", "ACTIVE", "INACTIVE"].includes(body.status))
        return fail("Invalid status.", 422);
      await db.product.update({ where: { id }, data: { status: body.status } });
      return ok({ success: true });
    }

    if (body.op === "stock") {
      const delta = Math.trunc(Number(body.delta));
      if (!Number.isFinite(delta)) return fail("Invalid stock change.", 422);
      const newStock = Math.max(0, product.stock + delta);
      await db.$transaction([
        db.product.update({ where: { id }, data: { stock: newStock } }),
        db.stockLog.create({
          data: {
            productId: id,
            delta: newStock - product.stock,
            reason: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
            note: body.note || null,
          },
        }),
        ...(newStock <= seller.lowStockThreshold && product.stock > seller.lowStockThreshold
          ? [
              db.notification.create({
                data: {
                  userId: seller.userId,
                  type: "STOCK",
                  title: "Low stock alert",
                  body: `${product.title} is down to ${newStock} units.`,
                  link: "/seller/products",
                },
              }),
            ]
          : []),
      ]);
      return ok({ stock: newStock });
    }

    if (body.op === "duplicate") {
      const full = await db.product.findUnique({
        where: { id },
        include: { images: true, variants: true },
      });
      if (!full) return fail("Not found", 404);
      const copy = await db.product.create({
        data: {
          sellerId: seller.id,
          categoryId: full.categoryId,
          title: `${full.title} (Copy)`,
          slug: `${full.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
          description: full.description,
          story: full.story,
          sku: full.sku,
          priceCents: full.priceCents,
          compareAtCents: full.compareAtCents,
          materials: full.materials,
          color: full.color,
          dimensions: full.dimensions,
          weightGrams: full.weightGrams,
          careInstructions: full.careInstructions,
          originCountry: full.originCountry,
          stock: full.stock,
          lowStockThreshold: full.lowStockThreshold,
          status: "DRAFT",
          featured: false,
          videoUrl: full.videoUrl,
          metaTitle: full.metaTitle,
          metaDescription: full.metaDescription,
          keywords: full.keywords,
          images: {
            create: full.images.map((img) => ({
              url: img.url, alt: img.alt, sortOrder: img.sortOrder,
            })),
          },
          variants: {
            create: full.variants.map((v) => ({
              name: v.name, optionSize: v.optionSize, optionColor: v.optionColor,
              optionMaterial: v.optionMaterial, priceDeltaCents: v.priceDeltaCents,
              stock: v.stock, sku: v.sku,
            })),
          },
          stockLogs: { create: [{ delta: full.stock, reason: "INIT", note: "Duplicated" }] },
        },
      });
      return ok({ id: copy.id }, { status: 201 });
    }

    return fail("Unknown operation.", 400);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handle(async () => {
    const { id } = await params;
    await assertOwned(id);
    try {
      await db.product.delete({ where: { id } });
    } catch {
      // Product referenced by orders — soft delete instead
      await db.product.update({ where: { id }, data: { status: "INACTIVE", featured: false } });
      return ok({ success: true, softDeleted: true });
    }
    return ok({ success: true });
  });
}
