"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Printer, Save, Loader2, MapPin,
  CreditCard, History, StickyNote, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Input, Label } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/ui/badge";

interface DetailOrder {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  couponCode: string | null;
  shipFullName: string;
  shipLine1: string;
  shipLine2: string | null;
  shipCity: string;
  shipState: string | null;
  shipPostalCode: string;
  shipCountry: string;
  shipPhone: string | null;
  shippingMethod: string;
  customerNote: string | null;
  internalNote: string | null;
  placedAt: string;
  estimatedDeliveryMin: string | null;
  estimatedDeliveryMax: string | null;
  items: {
    id: string;
    title: string;
    imageUrl: string | null;
    variantName: string | null;
    unitPriceCents: number;
    quantity: number;
    product: { slug: string };
  }[];
  events: { id: string; status: string; message: string | null; createdAt: string }[];
  payments: { id: string; provider: string; status: string; amountCents: number; providerRef: string | null }[];
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const { data, isLoading } = useQuery<{ order: DetailOrder }>({
    queryKey: ["seller-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/seller/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    },
  });

  const order = data?.order;

  useEffect(() => {
    if (order && !note) setNote(order.internalNote ?? "");
  }, [order]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/seller/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Action failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seller-order", id] });
      qc.invalidateQueries({ queryKey: ["seller-orders"] });
      setStatusMsg("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !order) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 rounded-lg" />
        <div className="skeleton h-40 rounded-lg" />
      </div>
    );
  }

  const canRefund = ["CANCELLED", "REFUNDED"].includes(order.status);
  const nextStatuses = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].filter((s) => s !== order.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/seller/orders"
            aria-label="Back to orders"
            className="flex h-9 w-9 items-center justify-center rounded-md card-surface transition hover:border-terracotta/50 hover:text-terracotta"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{order.orderNumber}</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Placed {new Date(order.placedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
            <Printer className="h-4 w-4" /> Print slip
          </Button>
        </div>
      </div>

      {/* Status updater */}
      <section className="rounded-lg card-surface p-4 shadow-subtle print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <Label htmlFor="next-status">Update status</Label>
            <Select id="next-status" defaultValue="" onChange={(e) => e.target.value && act.mutate({ op: "status", status: e.target.value, message: statusMsg })}>
              <option value="">Choose…</option>
              {nextStatuses.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </Select>
          </div>
          <div className="min-w-[220px] flex-1">
            <Input value={statusMsg} onChange={(e) => setStatusMsg(e.target.value)} placeholder="Optional note for the customer (e.g. tracking #)" />
          </div>
          {act.isPending && <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--muted))]" />}
        </div>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">Shipping, delivery &amp; cancellation updates email the customer automatically.</p>
      </section>

      {/* Items */}
      <section className="overflow-hidden rounded-lg card-surface shadow-subtle">
        <h2 className="border-b border-[rgb(var(--line)/0.6)] px-4 py-3 text-sm font-semibold">Your items</h2>
        <ul role="list" className="divide-y divide-[rgb(var(--line)/0.4)]">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 px-4 py-3">
              {i.imageUrl ? (
                <Image src={i.imageUrl} alt="" width={56} height={56} className="shrink-0 rounded-md object-cover" />
              ) : (
                <span className="h-14 w-14 shrink-0 rounded-md bg-sand dark:bg-charcoal-soft" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/products/${i.product.slug}`} className="line-clamp-1 text-sm font-semibold hover:text-terracotta">{i.title}</Link>
                {i.variantName && <p className="text-xs text-[rgb(var(--muted))]">{i.variantName}</p>}
                <p className="text-xs text-[rgb(var(--muted))]">{fmt(i.unitPriceCents)} × {i.quantity}</p>
              </div>
              <p className="text-sm font-bold tabular-nums">{fmt(i.unitPriceCents * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-[rgb(var(--line)/0.6)] px-4 py-3 text-sm">
          <Row label="Subtotal" value={fmt(order.subtotalCents)} />
          {order.discountCents > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`−${fmt(order.discountCents)}`} accent />}
          <Row label="Shipping" value={order.shippingCents === 0 ? "Free" : fmt(order.shippingCents)} />
          <Row label="Tax" value={fmt(order.taxCents)} />
          <div className="flex justify-between border-t border-dashed pt-1.5 font-bold"><dt>Order total</dt><dd>{fmt(order.totalCents)}</dd></div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shipping + payment */}
        <section className="rounded-lg card-surface p-4 shadow-subtle">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-terracotta" /> Ship to</h2>
          <address className="mt-2 not-italic text-sm leading-relaxed">
            <strong>{order.shipFullName}</strong><br />
            {order.shipLine1}{order.shipLine2 ? <>, {order.shipLine2}</> : null}<br />
            {order.shipCity}, {order.shipState} {order.shipPostalCode}<br />
            {order.shipCountry}
            {order.shipPhone && <><br /><span className="text-[rgb(var(--muted))]">{order.shipPhone}</span></>}
          </address>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Method: <strong>{order.shippingMethod}</strong>
            {order.estimatedDeliveryMin && order.estimatedDeliveryMax && (
              <> · ETA {new Date(order.estimatedDeliveryMin).toLocaleDateString()} – {new Date(order.estimatedDeliveryMax).toLocaleDateString()}</>
            )}
          </p>
          {order.customerNote && (
            <p className="mt-3 rounded-md bg-sand/70 p-3 text-sm dark:bg-charcoal-soft/40">
              <span className="font-semibold">Customer note:</span> {order.customerNote}
            </p>
          )}
          <h2 className="mt-4 flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4 text-terracotta" /> Payment</h2>
          <ul role="list" className="mt-1 space-y-1 text-sm text-[rgb(var(--muted))]">
            {order.payments.map((p) => (
              <li key={p.id}>
                {p.provider === "manual" ? "Manual record" : p.provider} · {fmt(p.amountCents)} ·{" "}
                <span className={p.status === "REFUNDED" ? "font-semibold text-error" : ""}>{p.status.toLowerCase()}</span>
              </li>
            ))}
          </ul>
          {canRefund && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 print:hidden"
              disabled={act.isPending || order.payments.every((p) => p.status === "REFUNDED")}
              onClick={() => {
                if (confirm("Record a refund for this order?")) act.mutate({ op: "refund", reason: "Seller-initiated refund" });
              }}
            >
              <Undo2 className="h-4 w-4" /> Refund order
            </Button>
          )}
        </section>

        {/* Timeline + notes */}
        <div className="space-y-6">
          <section className="rounded-lg card-surface p-4 shadow-subtle">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-terracotta" /> Timeline</h2>
            <ol role="list" className="relative mt-3 space-y-4 pl-6">
              <span aria-hidden className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-px bg-[rgb(var(--line))]" />
              {[...order.events].reverse().map((ev) => (
                <li key={ev.id} className="relative">
                  <span aria-hidden className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-terracotta bg-[rgb(var(--bg))]" />
                  <p className="text-sm font-medium capitalize">{ev.status.toLowerCase()}</p>
                  {ev.message && <p className="text-xs text-[rgb(var(--muted))]">{ev.message}</p>}
                  <time className="text-xs text-[rgb(var(--muted))]">{new Date(ev.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</time>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg card-surface p-4 shadow-subtle print:hidden">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="h-4 w-4 text-terracotta" /> Internal note</h2>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only you and your team see this." maxLength={2000} className="mt-2" />
            <Button
              size="sm"
              className="mt-2"
              disabled={act.isPending || note === (order.internalNote ?? "")}
              onClick={() => act.mutate({ op: "note", note })}
            >
              <Save className="h-4 w-4" /> Save note
            </Button>
          </section>
        </div>
      </div>

      {/* Print-only packing slip */}
      <div className="hidden print:block">
        <hr />
        <p className="pt-4 text-center font-mono text-sm">Packing slip · {order.orderNumber} · {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[rgb(var(--muted))]">{label}</dt>
      <dd className={accent ? "font-semibold text-success" : ""}>{value}</dd>
    </div>
  );
}
