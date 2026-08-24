import { cookies } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Region } from "@/lib/constants";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogControls } from "@/components/storefront/catalog-controls";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { EmptyState } from "@/components/ui/feedback";
import { SearchX } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All Handmade Goods",
  description:
    "Browse every handmade piece on Artisan Market — pottery, textiles, jewelry, woodwork and more from independent US & UK makers.",
};

interface SearchParams {
  q?: string; category?: string; materials?: string; color?: string;
  origin?: string; maxPrice?: string; sort?: string; page?: string;
}

const PAGE_SIZE = 12;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const region = ((cookieStore.get("region")?.value as Region) || "US") satisfies Region;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: any = { status: "ACTIVE" };
  if (sp.category) where.category = { slug: sp.category };
  if (sp.materials) where.materials = { contains: sp.materials };
  if (sp.color) where.color = { contains: sp.color };
  if (sp.origin) where.originCountry = sp.origin;
  if (sp.maxPrice && !Number.isNaN(Number(sp.maxPrice)))
    where.priceCents = { lte: Number(sp.maxPrice) };
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q } },
      { description: { contains: sp.q } },
      { keywords: { contains: sp.q } },
      { materials: { contains: sp.q } },
    ];
  }

  let orderBy: any;
  switch (sp.sort) {
    case "newest": orderBy = { createdAt: "desc" }; break;
    case "price_asc": orderBy = { priceCents: "asc" }; break;
    case "price_desc": orderBy = { priceCents: "desc" }; break;
    case "rating": orderBy = [{ ratingAvg: "desc" }, { ratingCount: "desc" }]; break;
    case "bestsellers": orderBy = { salesCount: "desc" }; break;
    default: orderBy = [{ salesCount: "desc" }, { viewCount: "desc" }];
  }

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        seller: { select: { shopName: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true, description: true } }),
  ]);

  const activeCategory = categories.find((c) => c.slug === sp.category);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-page py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: activeCategory ? activeCategory.name : "Shop All" },
        ]}
      />
      <header className="mb-8 mt-2">
        <h1 className="text-display-lg font-bold">{activeCategory?.name ?? "Shop All"}</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[rgb(var(--muted))]">
          {activeCategory?.description ??
            "Every piece one-of-one or small-batch — signed by the maker who created it."}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <div>
          <CatalogControls categories={categories} total={total} />
        </div>

        <div>
          {products.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title="Nothing found"
              description="Try adjusting your filters or search for something else."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    priority={i < 4}
                    region={region}
                    product={{
                      id: p.id, slug: p.slug, title: p.title,
                      priceCents: p.priceCents, compareAtCents: p.compareAtCents,
                      imageUrl: p.images[0]?.url, sellerName: p.seller.shopName,
                      ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, stock: p.stock,
                    }}
                  />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
