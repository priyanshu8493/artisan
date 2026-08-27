"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Flag, FlagOff, Trash2, Star } from "lucide-react";
import { Stars } from "@/components/ui/feedback";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  flagged: boolean;
  verifiedPurchase: boolean;
  sellerResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  sellerName: string;
  product: { id: string; title: string; slug: string; imageUrl: string | null };
}

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery<{ reviews: AdminReview[] }>({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (filter === "flagged") sp.set("flagged", "1");
      return (await fetch(`/api/admin/reviews?${sp}`)).json();
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async (review: AdminReview) => {
      const res = await fetch(`/api/admin/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, op: "flag" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Action failed");
    },
    onSuccess: () => {
      toast.success("Review flag updated");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Delete failed");
    },
    onSuccess: () => {
      toast.success("Review removed");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviews = data?.reviews ?? [];
  const flaggedCount = reviews.filter((r) => r.flagged).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Reviews</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{reviews.length} reviews{flaggedCount > 0 && ` · ${flaggedCount} flagged`}</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44" aria-label="Filter reviews">
          <option value="">All reviews</option>
          <option value="flagged">Flagged only</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-lg" />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={<Star className="h-6 w-6" />} title="No reviews here" />
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex flex-col gap-4 rounded-lg card-surface p-5 shadow-subtle sm:flex-row sm:items-start",
                r.flagged && "border-error/40"
              )}
            >
              <div className="flex min-w-0 flex-1 gap-4">
                {r.product.imageUrl ? (
                  <Image src={r.product.imageUrl} alt="" width={56} height={56} className="shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="h-14 w-14 shrink-0 rounded-md bg-sand dark:bg-charcoal-soft" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} showValue />
                    <span className="text-xs text-[rgb(var(--muted))]">
                      {r.verifiedPurchase ? "Verified purchase" : "Unverified"} · by {r.userName} ({r.userEmail})
                    </span>
                  </div>
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">{r.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgb(var(--muted))]">
                    <Link href={`/products/${r.product.slug}`} className="font-medium text-terracotta hover:underline">{r.product.title}</Link>
                    <span>· {r.sellerName}</span>
                    <span>· {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  {r.sellerResponse && (
                    <div className="mt-2 rounded-md bg-sand/70 p-3 text-xs dark:bg-charcoal-soft/40">
                      <span className="font-semibold">Seller response:</span> {r.sellerResponse}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1 sm:flex-col">
                <button
                  onClick={() => toggleFlag.mutate(r)}
                  title={r.flagged ? "Unflag" : "Flag"}
                  aria-label={r.flagged ? "Unflag review" : "Flag review"}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition",
                    r.flagged ? "bg-warning/15 text-warning" : "text-[rgb(var(--muted))] hover:bg-sand hover:text-warning dark:hover:bg-charcoal-soft"
                  )}
                >
                  {r.flagged ? <FlagOff className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Permanently delete this review?")) remove.mutate(r.id);
                  }}
                  title="Delete"
                  aria-label="Delete review"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
