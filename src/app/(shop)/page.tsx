import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Region } from "@/lib/constants";
import { Hero } from "@/components/storefront/hero";
import { CategoryCarousel } from "@/components/storefront/category-carousel";
import { ProductCard } from "@/components/storefront/product-card";
import { NewsletterModal } from "@/components/storefront/newsletter-modal";
import { SocialProofToast } from "@/components/storefront/social-proof";
import { Stars } from "@/components/ui/feedback";
import { ArrowRight, Quote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cookieStore = await cookies();
  const region = ((cookieStore.get("region")?.value as Region) || "US") satisfies Region;

  const [categories, featured, newest, spotlightSellers, topReviews] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { status: "ACTIVE", featured: true },
      include: {
        seller: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 8,
    }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, seller: true },
      take: 4,
    }),
    db.sellerProfile.findMany({
      where: { featured: true },
      include: { user: true, _count: { select: { products: true } } },
      take: 3,
    }),
    db.review.findMany({
      where: { rating: 5 },
      orderBy: { createdAt: "desc" },
      include: { user: true, product: true },
      take: 3,
    }),
  ]);

  const heroImage = "/hero.svg";

  return (
    <>
      <Hero heroImageUrl={heroImage} />

      <CategoryCarousel categories={categories} />

      {/* Featured products */}
      <section className="container-page pb-4 pt-2">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Curated for you</p>
            <h2 className="mt-2 text-display-md font-bold">Featured pieces</h2>
          </div>
          <Link href="/products?sort=rating" className="group hidden items-center gap-1 text-sm font-semibold text-terracotta sm:inline-flex">
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
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
      </section>

      {/* Storytelling collection band */}
      <section className="mt-24 bg-charcoal py-20 text-cream dark:bg-black/40">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta-light">Crafted by local artisans</p>
            <h2 className="mt-3 font-display text-display-lg font-bold leading-tight">
              Slow made, in small batches, meant to last generations
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-cream/70">
              We partner directly with independent makers — no factories, no mass production.
              Every purchase supports a real studio, a real family, and a craft passed down through hands.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-cream/85">
              {[
                "Direct-from-maker pricing",
                "Signed certificates of authenticity",
                "30-day returns, no questions asked",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[10px] text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/artisans" className="group mt-9 inline-flex items-center gap-2 font-semibold text-cream underline-offset-4 hover:text-terracotta-light hover:underline">
              Meet every maker
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {spotlightSellers.slice(0, 4).map((s, i) => (
              <Link
                key={s.id}
                href={`/artisans/${s.slug}`}
                className={`group relative overflow-hidden rounded-lg ${i % 2 === 1 ? "translate-y-6" : ""}`}
              >
                {s.logoUrl && (
                  <Image src={s.logoUrl} alt={s.shopName} width={300} height={300} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
                  <p className="font-display text-sm font-semibold text-white">{s.shopName}</p>
                  <p className="text-[11px] text-white/75">{s.city}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page py-16 lg:py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Just landed</p>
            <h2 className="mt-2 text-display-md font-bold">New arrivals</h2>
          </div>
          <Link href="/products?sort=newest" className="group hidden items-center gap-1 text-sm font-semibold text-terracotta sm:inline-flex">
            Shop new
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {newest.map((p) => (
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

      {/* Testimonials */}
      {topReviews.length > 0 && (
        <section className="border-t border-[rgb(var(--line)/0.6)] bg-[rgb(var(--surface))] py-16 dark:bg-transparent lg:py-20">
          <div className="container-page">
            <div className="mb-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Loved by customers</p>
              <h2 className="mt-2 text-display-md font-bold">What people are saying</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {topReviews.map((r) => (
                <figure key={r.id} className="rounded-lg card-surface p-7 shadow-subtle transition hover:shadow-card">
                  <Quote className="mb-4 h-6 w-6 text-terracotta/50" />
                  <blockquote className="text-sm leading-relaxed text-[rgb(var(--text))]">
                    “{r.body.length > 180 ? r.body.slice(0, 177) + "…" : r.body}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center justify-between border-t border-[rgb(var(--line)/0.6)] pt-4">
                    <div>
                      <p className="text-sm font-semibold">{r.user.name}</p>
                      <Link href={`/products/${r.product.slug}`} className="text-xs text-[rgb(var(--muted))] transition hover:text-terracotta">
                        on {r.product.title}
                      </Link>
                    </div>
                    <Stars value={r.rating} size={13} />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seller spotlight */}
      <section className="container-page py-16 lg:py-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Seller spotlight</p>
          <h2 className="mt-2 text-display-md font-bold">Makers we&apos;re loving right now</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {spotlightSellers.map((s) => (
            <Link key={s.id} href={`/artisans/${s.slug}`} className="group rounded-lg card-surface p-7 shadow-subtle transition hover:-translate-y-1 hover:shadow-lift">
              {s.logoUrl && (
                <Image src={s.logoUrl} alt={s.shopName} width={72} height={72} className="rounded-full shadow-subtle" />
              )}
              <h3 className="mt-4 font-display text-xl font-semibold group-hover:text-terracotta">{s.shopName}</h3>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-[rgb(var(--muted))]">{s.city}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[rgb(var(--muted))]">{s.tagline}</p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta">
                {s._count.products} pieces · Visit shop →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <NewsletterModal />
      <SocialProofToast />
    </>
  );
}
