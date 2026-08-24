import Image from "next/image";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Region } from "@/lib/constants";
import { ProductCard } from "@/components/storefront/product-card";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";

export const dynamic = "force-dynamic";

async function getSeller(slug: string) {
  return db.sellerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true } },
      products: {
        where: { status: "ACTIVE" },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, seller: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) return { title: "Artisan not found" };
  return {
    title: `${seller.shopName} — Handmade by ${seller.user?.name ?? seller.shopName}`,
    description: seller.bio || seller.tagline || `Shop handmade pieces from ${seller.shopName}.`,
  };
}

export default async function ArtisanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seller = await getSeller(slug);
  if (!seller) notFound();

  const cookieStore = await cookies();
  const region = ((cookieStore.get("region")?.value as Region) || "US") satisfies Region;

  const totalSales = seller.products.reduce((n, p) => n + p.salesCount, 0);
  const rated = seller.products.filter((p) => p.ratingCount > 0);
  const avgRating =
    rated.length > 0
      ? Math.round((rated.reduce((s, p) => s + p.ratingAvg, 0) / rated.length) * 10) / 10
      : 0;

  return (
    <div>
      {/* Banner */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sand to-terracotta/30 sm:h-64 dark:from-charcoal-soft dark:to-terracotta/20">
        {seller.bannerUrl && (
          <Image src={seller.bannerUrl} alt="" fill priority className="object-cover opacity-85" />
        )}
      </div>

      <div className="container-page">
        <div className="-mt-12 flex flex-col gap-6 sm:flex-row sm:items-end">
          {seller.logoUrl && (
            <Image
              src={seller.logoUrl}
              alt={seller.shopName}
              width={96}
              height={96}
              priority
              className="h-24 w-24 rounded-full border-4 border-[rgb(var(--bg))] shadow-lift"
            />
          )}
          <div className="flex-1 pb-1">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Artisans", href: "/artisans" }, { label: seller.shopName }]} />
            <h1 className="text-display-lg font-bold leading-tight">{seller.shopName}</h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              📍 {seller.city}, {seller.country === "GB" ? "United Kingdom 🇬🇧" : "United States 🇺🇸"}
              {totalSales > 0 && <> · {totalSales}+ sold</>}
              {avgRating > 0 && <> · ★ {avgRating.toFixed(1)} avg</>}
            </p>
          </div>
          <div className="rounded-md card-surface px-4 py-3 text-center shadow-subtle sm:text-right">
            <p className="font-display text-2xl font-bold">{seller.products.length}</p>
            <p className="text-xs text-[rgb(var(--muted))]">pieces available</p>
          </div>
        </div>

        {/* Story */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <section aria-label="About the maker">
            {seller.tagline && (
              <p className="font-display text-xl italic leading-relaxed text-[rgb(var(--muted))]">“{seller.tagline}”</p>
            )}
            {seller.bio && (
              <p className="mt-5 max-w-none leading-relaxed">{seller.bio}</p>
            )}
          </section>

          {/* Policies */}
          <aside className="space-y-4 rounded-lg card-surface p-6 shadow-subtle">
            <h2 className="font-display text-lg font-bold">Shop policies</h2>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">Shipping</p>
              <p className="mt-1 text-sm leading-relaxed">{seller.shippingPolicy}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">Returns</p>
              <p className="mt-1 text-sm leading-relaxed">{seller.returnPolicy}</p>
            </div>
          </aside>
        </div>

        {/* Products */}
        <section className="mt-16">
          <h2 className="mb-8 text-display-md font-bold">Shop all pieces</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {seller.products.map((p) => (
              <ProductCard
                key={p.id}
                region={region}
                product={{
                  id: p.id, slug: p.slug, title: p.title,
                  priceCents: p.priceCents, compareAtCents: p.compareAtCents,
                  imageUrl: p.images[0]?.url, sellerName: null,
                  ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, stock: p.stock,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
