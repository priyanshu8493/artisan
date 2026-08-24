"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { Stars } from "@/components/ui/feedback";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents?: number | null;
  imageUrl?: string | null;
  sellerName?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  stock?: number;
}

export function Price({
  cents,
  compareAtCents,
  region,
  className,
}: {
  cents: number;
  compareAtCents?: number | null;
  region: "US" | "GB";
  className?: string;
}) {
  const fmt = (c: number) =>
    new Intl.NumberFormat(region === "GB" ? "en-GB" : "en-US", {
      style: "currency",
      currency: region === "GB" ? "GBP" : "USD",
    }).format((region === "GB" ? Math.round(c * 0.79) : c) / 100);
  return (
    <span className={cn("flex items-baseline gap-2", className)}>
      <span className="font-semibold text-[rgb(var(--text))]">{fmt(cents)}</span>
      {compareAtCents && compareAtCents > cents && (
        <s className="text-xs font-normal text-[rgb(var(--muted))]">{fmt(compareAtCents)}</s>
      )}
    </span>
  );
}

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { user } = useSession();
  const { ids, toggle } = useWishlist(user?.id);
  const saved = ids.includes(productId);
  return (
    <button
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-subtle backdrop-blur transition-all hover:scale-110 dark:bg-charcoal/85",
        saved ? "text-terracotta" : "text-[rgb(var(--muted))]",
        className
      )}
    >
      <Heart className={cn("h-4.5 w-4.5 h-5 w-5 transition", saved && "fill-terracotta")} />
    </button>
  );
}

export function ProductCard({
  product,
  region = "US",
  priority = false,
}: {
  product: ProductCardData;
  region?: "US" | "GB";
  priority?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand dark:bg-charcoal-soft">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500 ease-out",
              hovered && "scale-105"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[rgb(var(--muted))]">No image</div>
        )}
        <WishlistButton productId={product.id} className="absolute right-2.5 top-2.5" />
        {product.stock === 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-charcoal/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream">
            Sold out
          </span>
        )}
        {product.compareAtCents && product.compareAtCents > product.priceCents && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-terracotta px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        {product.sellerName && (
          <p className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
            {product.sellerName}
          </p>
        )}
        <h3 className="line-clamp-1 font-display text-base font-medium leading-snug transition-colors group-hover:text-terracotta">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <Price cents={product.priceCents} compareAtCents={product.compareAtCents} region={region} />
          {(product.ratingCount ?? 0) > 0 && (
            <Stars value={product.ratingAvg ?? 0} size={12} showValue={false} />
          )}
        </div>
      </div>
    </Link>
  );
}
