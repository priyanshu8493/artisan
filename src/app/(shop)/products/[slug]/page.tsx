import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { Region } from "@/lib/constants";
import { Gallery } from "@/components/storefront/gallery";
import { BuyBox } from "@/components/storefront/buy-box";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { ProductCard } from "@/components/storefront/product-card";
import { ReviewsSection } from "@/components/storefront/reviews-section";
import { Stars } from "@/components/ui/feedback";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      seller: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { name: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
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
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0]?.url;
  return {
    title: product.metaTitle || product.title,
    description: product.metaDescription || product.description.slice(0, 158),
    keywords: product.keywords?.split(",").map((k) => k.trim()),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.title,
      description: product.metaDescription || product.description.slice(0, 158),
      images: image ? [{ url: image }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || product.status !== "ACTIVE") notFound();

  // Record view asynchronously (non-blocking)
  db.$transaction([
    db.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }),
    db.analyticsEvent.create({ data: { type: "PRODUCT_VIEW", productId: product.id } }),
  ]).catch(() => {});

  const cookieStore = await cookies();
  const region = ((cookieStore.get("region")?.value as Region) || "US") satisfies Region;

  const [related, alsoViewed] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, seller: true },
      take: 4,
    }),
    db.product.findMany({
      where: { status: "ACTIVE", sellerId: product.sellerId, id: { not: product.id } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, seller: true },
      take: 4,
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.description.slice(0, 500),
    image: product.images.map((i) => i.url),
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.seller.shopName },
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: region === "GB" ? "GBP" : "USD",
      price:
        (
          (region === "GB"
            ? Math.round(product.priceCents * 0.79)
            : product.priceCents) / 100
        ).toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const specs = [
    ["Materials", product.materials],
    ["Dimensions", product.dimensions],
    ["Weight", product.weightGrams ? `${product.weightGrams} g` : null],
    ["Colour", product.color],
    ["Care", product.careInstructions],
    ["Made in", product.originCountry === "GB" ? "United Kingdom 🇬🇧" : product.originCountry === "US" ? "United States 🇺🇸" : null],
  ].filter(([, v]) => !!v);

  const relatedProducts = related.length > 0 ? related : alsoViewed;

  return (
    <div className="container-page py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.category.name, href: `/products?category=${product.category.slug}` },
          { label: product.title },
        ]}
      />

      <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} title={product.title} videoUrl={product.videoUrl} />

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta">
            <Link href={`/products?category=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </p>
          <h1 className="mt-2 text-display-md font-bold leading-tight">{product.title}</h1>

          {(product.ratingCount > 0 || product.salesCount > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[rgb(var(--muted))]">
              {product.ratingCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Stars value={product.ratingAvg} size={15} />
                  <strong>{product.ratingAvg.toFixed(1)}</strong> ({product.ratingCount} review{product.ratingCount === 1 ? "" : "s"})
                </span>
              )}
              {product.salesCount > 10 && <span>· {product.salesCount}+ sold</span>}
            </div>
          )}

          <div className="mt-6">
            <BuyBox
              region={region}
              product={{
                id: product.id, slug: product.slug, title: product.title,
                priceCents: product.priceCents, compareAtCents: product.compareAtCents,
                stock: product.stock, lowStockThreshold: product.lowStockThreshold,
                imageUrl: product.images[0]?.url ?? null,
              }}
              variants={product.variants.map((v) => ({
                id: v.id, name: v.name, priceDeltaCents: v.priceDeltaCents, stock: v.stock,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Description + artisan + specs */}
      <div className="mt-16 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="about-product">
          <h2 id="about-product" className="text-display-sm text-2xl font-bold">About this piece</h2>
          <div className="rich-text mt-4 max-w-none text-[15px] leading-relaxed text-[rgb(var(--text))]/90">
            <p>{product.description}</p>
            {product.story && (
              <>
                <h3>From the maker</h3>
                <blockquote>{product.story}</blockquote>
              </>
            )}
          </div>

          {specs.length > 0 && (
            <>
              <h3 className="mt-10 text-xl font-bold">Details &amp; care</h3>
              <dl className="mt-4 overflow-hidden rounded-lg card-surface text-sm shadow-subtle">
                {specs.map(([label, value], i) => (
                  <div key={label as string} className={`grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] ${i % 2 === 1 ? "bg-sand/50 dark:bg-charcoal-soft/40" : ""}`}>
                    <dt className="px-4 py-3 font-semibold">{label}</dt>
                    <dd className="px-4 py-3 text-[rgb(var(--muted))]">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {/* Artisan profile card */}
        <aside className="h-fit rounded-lg border border-[rgb(var(--line)/0.7)] bg-gradient-to-b from-sand/70 to-transparent p-6 dark:from-charcoal-soft/60 lg:sticky lg:top-32">
          {product.seller.logoUrl && (
            <Image src={product.seller.logoUrl} alt={product.seller.shopName} width={64} height={64} className="rounded-full shadow-card" />
          )}
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">Meet your maker</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{product.seller.shopName}</h3>
          {product.seller.city && (
            <p className="text-sm text-[rgb(var(--muted))]">📍 {product.seller.city}</p>
          )}
          {product.seller.tagline && (
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">{product.seller.tagline}</p>
          )}
          <Link
            href={`/artisans/${product.seller.slug}`}
            className="group mt-5 inline-flex items-center gap-1.5 rounded-md bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal-soft dark:bg-cream dark:text-charcoal"
          >
            View more from this maker
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </aside>
      </div>

      {/* Reviews */}
      <ReviewsSection
        productId={product.id}
        ratingAvg={product.ratingAvg}
        ratingCount={product.ratingCount}
        reviews={product.reviews.map((r) => ({
          id: r.id,
          userName: r.user.name,
          rating: r.rating,
          title: r.title,
          body: r.body,
          verifiedPurchase: r.verifiedPurchase,
          sellerResponse: r.sellerResponse,
          createdAt: r.createdAt.toISOString(),
        }))}
      />

      {/* Related */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-display-md font-bold">
            {related.length > 0 ? "Related pieces" : "More from this maker"}
          </h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
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
        </section>
      )}
    </div>
  );
}
