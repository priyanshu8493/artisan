"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, PackageCheck, Truck } from "lucide-react";
import { QuantityStepper } from "@/components/ui/quantity";
import { Price, WishlistButton } from "./product-card";
import { useCart } from "@/store/cart";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export interface PdpProduct {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents?: number | null;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
}

export interface PdpVariant {
  id: string;
  name: string;
  priceDeltaCents: number;
  stock: number;
}

export function BuyBox({
  product,
  variants,
  region,
}: {
  product: PdpProduct;
  variants: PdpVariant[];
  region: "US" | "GB";
}) {
  const router = useRouter();
  const { user } = useSession();
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const effectiveStock = variant ? variant.stock : product.stock;
  const unitPrice = product.priceCents + (variant?.priceDeltaCents ?? 0);
  const soldOut = effectiveStock <= 0;

  // Delivery estimate from today
  const eta = useMemo(() => {
    const min = region === "GB" ? 3 : 4;
    const max = region === "GB" ? 5 : 7;
    const fmt = (d: Date) =>
      d.toLocaleDateString(region === "GB" ? "en-GB" : "en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
    return {
      range: `${fmt(new Date(Date.now() + min * 864e5))} – ${fmt(new Date(Date.now() + max * 864e5))}`,
      free: unitPrice >= (region === "GB" ? 6000 : 7500),
    };
  }, [region, unitPrice]);

  async function addToCart() {
    if (soldOut) return;
    setAdding(true);
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ADD_TO_CART", productId: product.id }),
      }).catch(() => {});
      add({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        imageUrl: product.imageUrl ?? "",
        priceCents: unitPrice,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        maxStock: Math.min(effectiveStock, 99),
        quantity: qty,
      });
      toast.success("Added to cart", {
        description: product.title + (variant ? ` · ${variant.name}` : ""),
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
    } finally {
      setTimeout(() => setAdding(false), 400);
    }
  }

  function buyNow() {
    addToCart().then(() => router.push("/checkout"));
  }

  const lowStock = !soldOut && effectiveStock <= Math.max(product.lowStockThreshold, 3);

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <Price cents={unitPrice} compareAtCents={product.compareAtCents} region={region} className="text-2xl" />
        {product.compareAtCents && product.compareAtCents > unitPrice && (
          <span className="ml-2 rounded bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta">
            Save {Math.round(((product.compareAtCents - unitPrice) / product.compareAtCents) * 100)}%
          </span>
        )}
      </div>

      {/* Stock indicator */}
      <div aria-live="polite" className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            soldOut ? "bg-error" : lowStock ? "animate-pulse bg-warning" : "bg-success"
          )}
        />
        {soldOut ? (
          <span className="font-medium text-error">Sold out — check back soon</span>
        ) : lowStock ? (
          <span className="font-medium text-warning">
            Only {effectiveStock} left{variant ? ` in ${variant.name}` : ""}
          </span>
        ) : (
          <span className="text-success">In stock · ships in 2–3 days</span>
        )}
      </div>

      {/* Variants */}
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Option: <span className="font-normal text-[rgb(var(--muted))]">{variant?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm font-medium transition",
                  v.stock <= 0 && "cursor-not-allowed opacity-40 line-through",
                  v.id === variantId
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "card-surface hover:border-terracotta/50"
                )}
              >
                {v.name}
                {v.priceDeltaCents > 0 && (
                  <span className="ml-1.5 text-xs text-[rgb(var(--muted))]">
                    +{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v.priceDeltaCents / 100)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + actions */}
      <div className="flex flex-wrap items-center gap-3">
        {!soldOut && (
          <QuantityStepper value={qty} onChange={setQty} max={Math.min(effectiveStock, 99)} />
        )}
        <button
          onClick={addToCart}
          disabled={soldOut || adding}
          className="h-12 flex-1 whitespace-nowrap rounded-md bg-charcoal px-6 font-semibold text-cream shadow-subtle transition hover:bg-charcoal-soft active:scale-[.98] disabled:opacity-50 dark:bg-cream dark:text-charcoal sm:min-w-[180px]"
        >
          {soldOut ? "Sold out" : adding ? "Adding…" : "Add to Cart"}
        </button>
        <button
          onClick={buyNow}
          disabled={soldOut}
          className="h-12 flex-1 whitespace-nowrap rounded-md bg-terracotta px-6 font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark active:scale-[.98] disabled:opacity-50 sm:min-w-[140px]"
        >
          Buy Now
        </button>
        <WishlistButton productId={product.id} className="!h-12 !w-12 shrink-0" />
      </div>

      {/* Trust / delivery */}
      <div className="space-y-2.5 rounded-lg card-surface p-4 text-sm shadow-innerSoft">
        <p className="flex items-center gap-2.5">
          <Truck className="h-4 w-4 shrink-0 text-terracotta" />
          <span>
            Estimated delivery <strong>{eta.range}</strong> to {region === "GB" ? "the UK" : "the US"}
            {eta.free && <span className="text-success"> · Free shipping</span>}
          </span>
        </p>
        <p className="flex items-center gap-2.5">
          <PackageCheck className="h-4 w-4 shrink-0 text-terracotta" />
          <span>Handmade to order by a real studio · 30-day returns</span>
        </p>
      </div>

      {user === null && (
        <button
          onClick={() => router.push(`/login?next=/products/${product.slug}`)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[rgb(var(--line))] py-2.5 text-xs text-[rgb(var(--muted))] transition hover:border-terracotta hover:text-terracotta"
        >
          <Heart className="h-3.5 w-3.5" /> Sign in to save this to your wishlist
        </button>
      )}
    </div>
  );
}
