"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Tag, ArrowRight } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity";
import { EmptyState } from "@/components/ui/feedback";
import { useCart } from "@/store/cart";
import { cookies } from "@/lib/client-cookies";

export default function CartPage() {
  const { items, remove, setQuantity } = useCart();
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [applying, setApplying] = useState(false);

  const region = ((typeof window !== "undefined" && cookies.get("region")) || "US") as "US" | "GB";
  const fmt = (centsUsd: number) =>
    new Intl.NumberFormat(region === "GB" ? "en-GB" : "en-US", {
      style: "currency",
      currency: region === "GB" ? "GBP" : "USD",
    }).format(((region === "GB" ? Math.round(centsUsd * 0.79) : centsUsd)) / 100);

  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const discount = coupon?.discountCents ?? 0;
  const shippingEstimate = subtotal - discount >= 7500 || subtotal === 0 ? 0 : 599;
  const estimatedTotal = subtotal - discount + shippingEstimate;

  async function applyCoupon() {
    if (!codeInput.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput, subtotalCents: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupon({ code: data.code, discountCents: data.discountCents });
      toast.success(`Code ${data.code} applied`);
    } catch (err) {
      setCoupon(null);
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setApplying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="text-display-lg font-bold">Your cart</h1>
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="Your cart is empty"
          description="Discover one-of-a-kind pieces from independent makers."
          action={
            <Link href="/products" className="mt-2 inline-flex h-11 items-center rounded-md bg-terracotta px-6 font-semibold text-white transition hover:bg-terracotta-dark">
              Start exploring <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-display-lg font-bold">Your cart</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId + (item.variantId ?? "")}
              className="flex gap-4 rounded-lg card-surface p-4 shadow-subtle sm:gap-6"
            >
              <Link href={`/products/${item.slug}`} className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md bg-sand sm:w-28 dark:bg-charcoal-soft">
                <Image src={item.imageUrl} alt={item.title} fill sizes="112px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="line-clamp-2 font-display font-medium hover:text-terracotta">
                      {item.title}
                    </Link>
                    {item.variantName && (
                      <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{item.variantName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.productId, item.variantId)}
                    aria-label={`Remove ${item.title}`}
                    className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(v) => setQuantity(item.productId, item.variantId, v)}
                    max={Math.min(item.maxStock, 99)}
                  />
                  <p className="font-semibold tabular-nums">{fmt(item.priceCents * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-lg card-surface p-6 shadow-card lg:sticky lg:top-32" aria-label="Order summary">
          <h2 className="font-display text-xl font-bold">Summary</h2>

          {/* Coupon */}
          <div className="mt-5">
            {coupon ? (
              <div className="flex items-center justify-between rounded-md bg-success/10 px-3 py-2.5 text-sm">
                <span className="font-semibold text-success">✓ {coupon.code}</span>
                <button onClick={() => setCoupon(null)} className="text-xs text-error hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); applyCoupon(); }} className="flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Discount code"
                  aria-label="Discount code"
                  className="h-10 flex-1 rounded-md card-surface px-3 text-sm uppercase placeholder:normal-case focus:border-terracotta focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="h-10 rounded-md border border-charcoal px-4 text-sm font-semibold transition hover:border-terracotta hover:text-terracotta disabled:opacity-50 dark:border-cream/40"
                >
                  Apply
                </button>
              </form>
            )}
            <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">Psst — try WELCOME10</p>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-[rgb(var(--line)/0.7)] pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(subtotal)}</dd></div>
            {discount > 0 && (
              <div className="flex justify-between text-success"><dt>Discount</dt><dd>−{fmt(discount)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shippingEstimate === 0 ? <span className="text-success">Free</span> : fmt(shippingEstimate)}</dd>
            </div>
            <div className="flex justify-between"><dt>Tax</dt><dd className="text-[rgb(var(--muted))]">Calculated at checkout</dd></div>
            <div className="flex justify-between border-t border-[rgb(var(--line)/0.7)] pt-3 text-base font-bold">
              <dt>Estimated total</dt><dd>{fmt(estimatedTotal)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="group mt-6 flex h-12 items-center justify-center gap-2 rounded-md bg-terracotta font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark active:scale-[.98]"
          >
            Checkout
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/products" className="mt-3 block text-center text-sm text-[rgb(var(--muted))] transition hover:text-terracotta">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
