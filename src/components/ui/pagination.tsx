"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function go(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-md card-surface transition hover:border-terracotta/40 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {sorted.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && p - sorted[i - 1] > 1 && (
            <span className="px-1 text-sm text-[rgb(var(--muted))]">…</span>
          )}
          <button
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-9 w-9 rounded-md text-sm font-medium transition",
              p === page
                ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal"
                : "card-surface hover:border-terracotta/40"
            )}
          >
            {p}
          </button>
        </React.Fragment>
      ))}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-md card-surface transition hover:border-terracotta/40 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
