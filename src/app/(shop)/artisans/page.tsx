import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meet Our Artisans",
  description:
    "Independent makers from across the US and UK — potters, weavers, metalsmiths and woodworkers who sign everything they make.",
};

export default async function ArtisansPage() {
  const sellers = await db.sellerProfile.findMany({
    orderBy: [{ featured: "desc" }, { shopName: "asc" }],
    include: {
      user: { select: { name: true } },
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
  });

  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Our community</p>
        <h1 className="mt-3 text-display-lg font-bold">The hands behind the craft</h1>
        <p className="mt-4 leading-relaxed text-[rgb(var(--muted))]">
          Every maker here runs their own studio. When you buy from them, they feel it —
          and so does the tradition they carry forward.
        </p>
      </header>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sellers.map((s) => (
          <Link
            key={s.id}
            href={`/artisans/${s.slug}`}
            className="group overflow-hidden rounded-lg card-surface shadow-subtle transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative h-36 bg-gradient-to-br from-sand to-terracotta/30 dark:from-charcoal-soft dark:to-terracotta/20">
              {s.bannerUrl && (
                <Image src={s.bannerUrl} alt="" fill sizes="(max-width:640px) 100vw, 400px" className="object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
              )}
              {s.logoUrl && (
                <Image
                  src={s.logoUrl}
                  alt={s.shopName}
                  width={64}
                  height={64}
                  className="absolute -bottom-8 left-6 rounded-full border-4 border-[rgb(var(--surface))] shadow-card"
                />
              )}
            </div>
            <div className="px-6 pb-6 pt-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold transition group-hover:text-terracotta">{s.shopName}</h2>
                {s.featured && (
                  <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">Featured</span>
                )}
              </div>
              <p className="mt-0.5 text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
                {s.city} · {s.country === "GB" ? "United Kingdom 🇬🇧" : "United States 🇺🇸"}
              </p>
              {s.tagline && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{s.tagline}</p>}
              <p className="mt-4 text-sm font-semibold text-terracotta">{s._count.products} pieces in shop →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
