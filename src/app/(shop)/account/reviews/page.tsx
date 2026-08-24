"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Stars, EmptyState } from "@/components/ui/feedback";
import { AccountShell } from "@/components/account/account-shell";
import { MessageSquareQuote } from "lucide-react";

interface MyReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  sellerResponse: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  product: { slug: string; title: string; images: { url: string }[] };
}

export default function MyReviewsPage() {
  const { data, isLoading } = useQuery<{ reviews: MyReview[] }>({
    queryKey: ["my-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews/mine");
      if (!res.ok) return { reviews: [] };
      return res.json();
    },
  });

  return (
    <AccountShell title="My reviews" subtitle="Reviews you've written for pieces you own">
      {isLoading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-28 rounded-lg" />)}</div>
      ) : !data?.reviews?.length ? (
        <EmptyState
          title="No reviews yet"
          description="After an order is confirmed you can review each piece from your Orders page."
        />
      ) : (
        <ul className="space-y-4">
          {data.reviews.map((r) => (
            <li key={r.id} className="rounded-lg card-surface p-5 shadow-subtle">
              <div className="flex items-start gap-4">
                <Image src={r.product.images[0]?.url ?? "/hero.svg"} alt="" width={56} height={56} className="rounded-md bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/products/${r.product.slug}`} className="truncate font-display font-semibold hover:text-terracotta">
                      {r.product.title}
                    </Link>
                    <Stars value={r.rating} size={13} showValue />
                  </div>
                  {r.title && <p className="mt-1.5 text-sm font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">{r.body}</p>
                  {r.sellerResponse && (
                    <div className="mt-3 flex gap-2.5 rounded-md bg-sand/60 p-3 dark:bg-charcoal-soft/50">
                      <MessageSquareQuote className="h-4 w-4 shrink-0 text-terracotta" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold uppercase tracking-wide text-terracotta">Maker replied:</span> {r.sellerResponse}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
