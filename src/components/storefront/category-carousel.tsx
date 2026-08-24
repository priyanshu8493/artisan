"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CategoryTile {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
}

export function CategoryCarousel({ categories }: { categories: CategoryTile[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  }

  return (
    <section className="container-page py-16 lg:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-terracotta">Browse by craft</p>
          <h2 className="mt-2 text-display-md font-bold">A home for every craft</h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll categories left"
            className="flex h-10 w-10 items-center justify-center rounded-full card-surface shadow-subtle transition hover:border-terracotta/50 hover:text-terracotta"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll categories right"
            className="flex h-10 w-10 items-center justify-center rounded-full card-surface shadow-subtle transition hover:border-terracotta/50 hover:text-terracotta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2"
      >
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/products?category=${c.slug}`}
            className="group w-[240px] shrink-0 snap-start sm:w-[280px]"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-sand dark:bg-charcoal-soft">
              {c.imageUrl && (
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  fill
                  sizes="280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 p-5">
                <h3 className="font-display text-lg font-semibold text-white">{c.name}</h3>
                <span className="mt-1 inline-block translate-y-1 text-xs font-medium uppercase tracking-wider text-white/80 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Shop now →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
