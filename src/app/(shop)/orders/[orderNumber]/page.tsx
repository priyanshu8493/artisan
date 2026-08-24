import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckCircle2, Package, Truck, Mail, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const fmt = (c: number) =>
    new Intl.NumberFormat(order.region === "GB" ? "en-GB" : "en-US", {
      style: "currency",
      currency: order.currency,
    }).format(c / 100);

  const etaMin = order.estimatedDeliveryMin?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const etaMax = order.estimatedDeliveryMax?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="container-page max-w-2xl py-16">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success animate-fadeUp">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-display-lg font-bold">Thank you — order confirmed!</h1>
        <p className="mt-3 text-[rgb(var(--muted))]">
          Order <strong className="text-[rgb(var(--text))]">{order.orderNumber}</strong> ·{" "}
          A confirmation email is on its way to {order.email}.
        </p>
      </div>

      {/* Timeline */}
      <ol className="mt-12 space-y-0 rounded-lg card-surface p-6 shadow-card">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 border-b border-[rgb(var(--line)/0.6)] py-4 first:pt-0 last:border-0 last:pb-0">
            <Image src={item.imageUrl ?? "/hero.svg"} alt="" width={56} height={56} className="rounded-md bg-sand object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">Qty {item.quantity}{item.variantName ? ` · ${item.variantName}` : ""}</p>
            </div>
            <p className="font-semibold tabular-nums">{fmt(item.unitPriceCents * item.quantity)}</p>
          </li>
        ))}
        <li className="space-y-1.5 border-t border-[rgb(var(--line)/0.7)] pt-4 text-sm">
          <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Subtotal</span><span>{fmt(order.subtotalCents)}</span></div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-success"><span>Discount ({order.couponCode})</span><span>−{fmt(order.discountCents)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Shipping</span><span>{order.shippingCents === 0 ? "Free" : fmt(order.shippingCents)}</span></div>
          <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Tax{order.region === "GB" ? " (VAT)" : ""}</span><span>{fmt(order.taxCents)}</span></div>
          <div className="flex justify-between pt-1 text-base font-bold"><span>Total paid</span><span>{fmt(order.totalCents)}</span></div>
        </li>
      </ol>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg card-surface p-5 shadow-subtle">
          <p className="flex items-center gap-2 text-sm font-bold"><Truck className="h-4 w-4 text-terracotta" /> Estimated delivery</p>
          <p className="mt-1.5 text-sm text-[rgb(var(--muted))]">{etaMin} – {etaMax}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {order.shipLine1}, {order.shipCity} {order.shipPostalCode}
          </p>
        </div>
        <div className="rounded-lg card-surface p-5 shadow-subtle">
          <p className="flex items-center gap-2 text-sm font-bold"><Package className="h-4 w-4 text-terracotta" /> Tracking</p>
          <p className="mt-1.5 text-sm text-[rgb(var(--muted))]">
            Status: <strong className="text-info">Processing</strong> — your makers have been notified.
          </p>
          <Link href="/account/orders" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline">
            Track in your orders <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/products" className="inline-flex h-11 items-center rounded-md bg-charcoal px-6 font-semibold text-cream transition hover:bg-charcoal-soft dark:bg-cream dark:text-charcoal">
          Continue shopping
        </Link>
        {!order.userId && (
          <Link href="/register" className="inline-flex h-11 items-center rounded-md card-surface px-6 text-sm font-medium shadow-subtle hover:border-terracotta/50">
            <Mail className="mr-2 h-4 w-4" /> Create an account to track this order
          </Link>
        )}
      </div>
    </div>
  );
}
