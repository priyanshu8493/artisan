import { db } from "@/lib/db";
import { ok, handle, readJson } from "@/lib/api";
import { requireSeller } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { uniqueSlug } from "@/lib/utils";

export async function GET(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const sp = new URL(req.url).searchParams;
    const status = sp.get("status");
    const q = sp.get("q")?.trim();

    const products = await db.product.findMany({
      where: {
        sellerId: seller.id,
        ...(status && ["DRAFT", "ACTIVE", "INACTIVE"].includes(status) ? { status } : {}),
        ...(q ? { OR: [{ title: { contains: q } }, { sku: { contains: q } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: true,
      },
    });

    return ok({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        status: p.status,
        priceCents: p.priceCents,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        categoryName: p.category.name,
        imageUrl: p.images[0]?.url ?? null,
        salesCount: p.salesCount,
        viewCount: p.viewCount,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        variantCount: p.variants.length,
        variantStock: p.variants.reduce((n, v) => n + v.stock, 0),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const { seller } = await requireSeller();
    const body = productSchema.parse(await readJson(req));

    const slug = body.slug ? body.slug : uniqueSlug(body.title);

    // Ensure unique slug
    const existing = await db.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Math.random().toString(36).slice(2, 6)}` : slug;

    const product = await db.product.create({
      data: {
        sellerId: seller.id,
        categoryId: body.categoryId,
        title: body.title,
        slug: finalSlug,
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
        stock: Math.max(0, body.stock - (body.status === "ACTIVE" && body.variants.length > 0 ? body.variants.reduce((n, v) => n + v.stock, 0) : 0)),
        lowStockThreshold: body.lowStockThreshold,
        status: body.status,
        featured: body.featured,
        videoUrl: body.videoUrl || null,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        keywords: body.keywords || null,
        isDraftSaved: true,
        images: {
          create: body.images.map((img, i) => ({ url: img.url, alt: img.alt ?? null, sortOrder: i })),
        },
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
        stockLogs: { create: [{ delta: body.stock, reason: "INIT", note: "Created" }] },
      },
      select: { id: true, slug: true },
    });

    return ok({ id: product.id, slug: product.slug }, { status: 201 });
  });
}
