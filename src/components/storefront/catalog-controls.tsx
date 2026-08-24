"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Select, Label, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterCategory { name: string; slug: string }

const SORTS = [
  ["trending", "Trending"],
  ["newest", "Newest"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["rating", "Top Rated"],
  ["bestsellers", "Bestsellers"],
] as const;

export function CatalogControls({
  categories,
  total,
}: {
  categories: FilterCategory[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = (key: string) => params.get(key) ?? "";

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  const activeCount = ["category", "minPrice", "maxPrice", "materials", "color", "origin"].filter((k) => params.get(k)).length;

  const sidebar = (
    <div className={cn("space-y-6", pending && "opacity-60 transition-opacity")}>
      <div>
        <Label>Category</Label>
        <Select value={current("category")} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Max price</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="No limit"
            defaultValue={current("maxPrice")}
            onBlur={(e) => update({ maxPrice: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && update({ maxPrice: (e.target as HTMLInputElement).value })}
          />
        </div>
      </div>

      <div>
        <Label>Material</Label>
        <Select value={current("materials")} onChange={(e) => update({ materials: e.target.value })}>
          <option value="">Any material</option>
          {["Ceramic", "Stoneware", "Porcelain", "Oak", "Walnut", "Ash", "Wool", "Linen", "Silver", "Gold", "Leather", "Glass", "Soy Wax"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Colour</Label>
        <Select value={current("color")} onChange={(e) => update({ color: e.target.value })}>
          <option value="">Any colour</option>
          {["Terracotta", "Cream", "Charcoal", "Forest Green", "Indigo", "Sand", "Rust", "Natural Wood", "Gold", "Slate Blue"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Made in</Label>
        <div className="flex gap-2">
          {[
            ["", "Anywhere"],
            ["US", "🇺🇸 USA"],
            ["GB", "🇬🇧 UK"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => update({ origin: v || undefined })}
              className={cn(
                "flex-1 rounded-md border py-2 text-xs font-semibold transition",
                current("origin") === v
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "card-surface hover:border-terracotta/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={() => startTransition(() => router.push(pathname))}
          className="inline-flex items-center gap-1 text-xs font-semibold text-error hover:underline"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[rgb(var(--muted))]">
          {total} piece{total === 1 ? "" : "s"}
          {params.get("q") && <> for “<strong>{params.get("q")}</strong>”</>}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 items-center gap-2 rounded-md card-surface px-4 text-sm font-medium shadow-subtle lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeCount > 0 && ` (${activeCount})`}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-[rgb(var(--muted))] sm:inline">Sort:</span>
            <Select
              value={current("sort") || "trending"}
              onChange={(e) => update({ sort: e.target.value })}
              className="w-44"
              aria-label="Sort products"
            >
              {SORTS.map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">{sidebar}</aside>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-[rgb(var(--bg))] p-6 pb-10 animate-fadeUp">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Filters</h3>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-8 h-11 w-full rounded-md bg-terracotta font-semibold text-white"
            >
              Show {total} results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
