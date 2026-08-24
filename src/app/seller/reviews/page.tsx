"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Flag, MessageSquareReply, BadgeCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/input";
import { EmptyState, Stars } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface SellerReview {
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
  product: { id: string; title: string; slug: string; imageUrl: string | null };
}

export default function SellerReviewsPage() {
  const qc = useQueryClient();
  const [rating, setRating] = useState("");
  const [replying, setReplying] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data, isLoading } = useQuery<{ reviews: SellerReview[] }>({
    queryKey: ["seller-reviews", rating],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rating) params.set("rating", rating);
      return (await fetch(`/api/seller/reviews?${params}`)).json();
    },
  });

  const act = useMutation({
    mutationFn: async (body: { reviewId: string; op: "respond" | "flag"; response?: string; flagged?: boolean }) => {
      const res = await fetch("/api/seller/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Action failed");
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.op === "respond" ? "Response published" : vars.flagged ? "Review flagged for moderation" : "Flag removed");
      setReplying(null);
      setDraft("");
      qc.invalidateQueries({ queryKey: ["seller-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitResponse(id: string) {
    const text = draft.trim();
    if (text.length < 2) {
      toast.error("Write a short reply first.");
      return;
    }
    act.mutate({ reviewId: id, op: "respond", response: text });
  }

  const reviews = data?.reviews ?? [];
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Reviews</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            {avg ? <>Average rating <strong className="text-[rgb(var(--fg))]">{avg}</strong> across {reviews.length} reviews</> : `${reviews.length} reviews`}
          </p>
        </div>
        <Select value={rating} onChange={(e) => setRating(e.target.value)} className="w-36" aria-label="Filter by rating">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40 rounded-lg" />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No reviews yet"
          description="Reviews arrive after customers receive their orders — they build trust with future shoppers."
        />
      ) : (
        <ul role="list" className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={cn("rounded-lg card-surface p-5 shadow-subtle transition", r.flagged && "ring-1 ring-error/60")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} size={14} />
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success dark:bg-success/20">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {r.flagged && <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">Flagged</span>}
                  </div>
                  <p className="mt-1.5 text-sm">
                    <strong>{r.userName}</strong>
                    <span className="text-[rgb(var(--muted))]"> on </span>
                    <Link href={`/products/${r.product.slug}`} className="font-medium text-terracotta hover:underline">{r.product.title}</Link>
                  </p>
                  <time className="text-xs text-[rgb(var(--muted))]">{new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</time>
                </div>
                <button
                  onClick={() => act.mutate({ reviewId: r.id, op: "flag", flagged: !r.flagged })}
                  disabled={act.isPending}
                  aria-label={r.flagged ? "Remove flag" : "Flag review"}
                  title={r.flagged ? "Remove flag" : "Flag for moderation"}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md transition",
                    r.flagged ? "bg-error/10 text-error" : "text-[rgb(var(--muted))] hover:bg-sand hover:text-error dark:hover:bg-charcoal-soft"
                  )}
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>

              {r.title && <p className="mt-3 font-display font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--fg-muted,#555))] dark:text-[rgb(var(--fg-muted))]">{r.body}</p>

              {/* Existing response */}
              {r.sellerResponse && replying !== r.id && (
                <div className="mt-3 rounded-md border-l-4 border-terracotta bg-sand/60 p-3 dark:bg-charcoal-soft/40">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-terracotta">
                    <MessageSquareReply className="h-3.5 w-3.5" /> Your response
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{r.sellerResponse}</p>
                  {r.respondedAt && <time className="text-xs text-[rgb(var(--muted))]">{new Date(r.respondedAt).toLocaleDateString()}</time>}
                </div>
              )}

              {/* Reply composer */}
              {replying === r.id ? (
                <div className="mt-3">
                  <Textarea
                    rows={3}
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Thank the customer, address concerns, share care tips…"
                    maxLength={1000}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => submitResponse(r.id)} disabled={act.isPending}>
                      <Send className="h-3.5 w-3.5" /> Post reply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setReplying(null); setDraft(""); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                !r.sellerResponse && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => { setReplying(r.id); setDraft(""); }}
                  >
                    <MessageSquareReply className="h-3.5 w-3.5" /> Respond
                  </Button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
