"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { OrderStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AccountShell } from "@/components/account/account-shell";
import { Modal } from "@/components/ui/modal";
import { QuantityStepper } from "@/components/ui/quantity";
import { Textarea, Label } from "@/components/ui/input";
import { Stars } from "@/components/ui/feedback";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { PackageOpen, RefreshCcw, Star } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  variantName: string | null;
  unitPriceCents: number;
  quantity: number;
  reviewed?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  placedAt: string;
  estimatedDeliveryMin?: string | null;
  estimatedDeliveryMax?: string | null;
  items: OrderItem[];
  events: { status: string; message: string | null; createdAt: string }[];
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const add = useCart((s) => s.add);
  const [reviewItem, setReviewItem] = useState<OrderItem | null>(null);

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ["account-orders"],
    queryFn: async () => (await fetch("/api/account/orders")).json(),
  });

  const reorder = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch("/api/account/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error("Could not load previous items");
      return res.json();
    },
    onSuccess: (d: any) => {
      let added = 0;
      for (const item of d.items ?? []) {
        if (!item.available) continue;
        add({
          productId: item.productId,
          slug: item.slug,
          title: item.title,
          imageUrl: item.imageUrl,
          priceCents: item.priceCents,
          variantId: item.variantId,
          variantName: item.variantName,
          maxStock: item.maxStock,
          quantity: item.quantity,
        });
        added++;
      }
      toast.success(`${added} item${added === 1 ? "" : "s"} added back to your cart`);
    },
    onError: () => toast.error("Reorder failed"),
  });

  const fmt = (cents: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

  return (
    <AccountShell title="Your orders" subtitle="Track deliveries and revisit past purchases">
      {isLoading ? (
        <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-40 rounded-lg" />)}</div>
      ) : !data?.orders?.length ? (
        <EmptyState
          icon={<PackageOpen className="h-6 w-6" />}
          title="No orders yet"
          description="When you place an order it will show up here with live tracking."
        />
      ) : (
        <ul className="space-y-6">
          {data.orders.map((order) => (
            <li key={order.id} className="overflow-hidden rounded-lg card-surface shadow-subtle">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.6)] bg-sand/50 px-5 py-3.5 dark:bg-charcoal-soft/40">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span><span className="text-[rgb(var(--muted))]">Order </span><strong>{order.orderNumber}</strong></span>
                  <span><span className="text-[rgb(var(--muted))]">Placed </span>
                    {new Date(order.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="font-bold">{fmt(order.totalCents, order.currency)}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </header>

              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <Image src={item.imageUrl ?? "/hero.svg"} alt="" width={52} height={52} className="rounded-md bg-sand object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">×{item.quantity}{item.variantName ? ` · ${item.variantName}` : ""}</p>
                      </div>
                      {["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && (
                        <button
                          onClick={() => setReviewItem(item)}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                            item.reviewed
                              ? "cursor-default bg-success/10 text-success"
                              : "border border-gold/60 text-gold hover:bg-gold/10"
                          }`}
                        >
                          <Star className="h-3.5 w-3.5" /> {item.reviewed ? "Reviewed" : "Review"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                <aside className="space-y-4 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  {/* Timeline */}
                  <ol className="space-y-2.5 text-xs">
                    {[...order.events].reverse().map((ev, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-hidden />
                        <span>
                          <strong className="block">{ev.status}</strong>
                          {ev.message && <span className="text-[rgb(var(--muted))]">{ev.message}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                    <button
                      onClick={() => reorder.mutate(order.id)}
                      disabled={reorder.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-md card-surface py-2.5 text-sm font-semibold shadow-subtle transition hover:border-terracotta/50 hover:text-terracotta disabled:opacity-50"
                    >
                      <RefreshCcw className={`h-4 w-4 ${reorder.isPending ? "animate-spin" : ""}`} />
                      Reorder
                    </button>
                  )}
                </aside>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Review modal */}
      {reviewItem && (
        <WriteReviewModal
          item={reviewItem}
          onClose={() => setReviewItem(null)}
          onDone={() => {
            setReviewItem(null);
            qc.invalidateQueries({ queryKey: ["account-orders"] });
          }}
        />
      )}
    </AccountShell>
  );
}

function WriteReviewModal({
  item,
  onClose,
  onDone,
}: {
  item: OrderItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          orderItemId: item.id,
          rating,
          title: title || null,
          body,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not submit review");
      toast.success("Thank you! Your review is live.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy="review-modal-title">
      <form onSubmit={submit} className="p-6">
        <h3 id="review-modal-title" className="font-display text-xl font-bold">Review your purchase</h3>
        <p className="mt-1 truncate text-sm text-[rgb(var(--muted))]">{item.title}</p>

        <div className="mt-5">
          <Label required>Your rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                className="transition hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${star <= rating ? "fill-gold text-gold" : "text-[rgb(var(--line))]"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="review-title">Headline</Label>
          <input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Sum it up in a few words"
            className="h-10 w-full rounded-md card-surface px-3 text-sm focus:border-terracotta focus:outline-none"
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="review-body" required>What did you think?</Label>
          <Textarea
            id="review-body"
            required
            minLength={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Quality, packaging, delivery — tell other shoppers about it."
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2.5 text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || body.length < 10}
            className="rounded-md bg-terracotta px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
