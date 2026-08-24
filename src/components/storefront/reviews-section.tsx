"use client";

import { useState } from "react";
import { BadgeCheck, MessageSquareQuote } from "lucide-react";
import { Stars, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface ReviewData {
  id: string;
  userName: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  sellerResponse: string | null;
  createdAt: string;
}

export function ReviewsSection({
  productId,
  ratingAvg,
  ratingCount,
  reviews,
}: {
  productId: string;
  ratingAvg: number;
  ratingCount: number;
  reviews: ReviewData[];
}) {
  const [filter, setFilter] = useState<number | null>(null);

  const distribution = useMemoDistribution(reviews);
  const shown = filter ? reviews.filter((r) => r.rating === filter) : reviews;

  return (
    <section className="mt-20" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-display-md font-bold">Customer reviews</h2>

      <div className="mt-6 grid gap-8 rounded-lg card-surface p-6 shadow-subtle sm:grid-cols-[200px_1fr_auto] sm:items-center">
        <div className="text-center sm:text-left">
          <p className="font-display text-5xl font-bold">{ratingAvg.toFixed(1)}</p>
          <Stars value={ratingAvg} size={16} className="justify-center sm:justify-start" />
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Based on {ratingCount} review{ratingCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilter(filter === star ? null : star)}
              aria-label={`Show ${star}-star reviews`}
              className={cn(
                "group flex w-full items-center gap-3 text-xs",
                filter && filter !== star && "opacity-40"
              )}
            >
              <span className="w-10 font-medium">{star} ★</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--line)/0.6)]">
                <span
                  className={cn(
                    "block h-full rounded-full transition-all group-hover:bg-gold/80",
                    star >= 4 ? "bg-gold" : star === 3 ? "bg-warning" : "bg-error"
                  )}
                  style={{ width: `${distribution[star] ?? 0}%` }}
                />
              </span>
              <span className="w-8 text-right text-[rgb(var(--muted))]">{distribution[star] ?? 0}%</span>
            </button>
          ))}
        </div>
        <p className="hidden max-w-[180px] text-xs leading-relaxed text-[rgb(var(--muted))] lg:block">
          Reviews marked with a badge come from verified purchases of this item.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {shown.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description={filter ? `No ${filter}-star reviews for this piece.` : "Be the first to share your thoughts after purchase."}
          />
        ) : (
          shown.map((r) => (
            <article key={r.id} className="rounded-lg card-surface p-6 shadow-subtle">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand dark:bg-charcoal-soft font-display text-sm font-bold text-terracotta">
                    {r.userName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      {r.userName}
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                          <BadgeCheck className="h-3 w-3" /> Verified purchase
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <Stars value={r.rating} size={14} />
              </header>
              {r.title && <h3 className="mt-4 font-display text-base font-semibold">{r.title}</h3>}
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text))]/85">{r.body}</p>

              {r.sellerResponse && (
                <div className="mt-4 flex gap-3 rounded-md bg-sand/60 p-4 dark:bg-charcoal-soft/50">
                  <MessageSquareQuote className="h-5 w-5 shrink-0 text-terracotta" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-terracotta">Response from the maker</p>
                    <p className="mt-1 text-sm leading-relaxed">{r.sellerResponse}</p>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function useMemoDistribution(reviews: ReviewData[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const r of reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;
  const total = Math.max(1, reviews.length);
  return Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [Number(k), Math.round((v / total) * 100)])
  );
}
