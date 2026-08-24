"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cookies } from "@/lib/client-cookies";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/ui/feedback";
import { Heart } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export default function WishlistPage() {
  const region = ((typeof window !== "undefined" && cookies.get("region")) || "US") as "US" | "GB";
  const { user, loading: sessionLoading } = useSession();

  const enabled = !!user;
  const { data, isLoading } = useQuery<{ products: ProductCardData[] }>({
    queryKey: ["wishlist"],
    queryFn: async () => (await fetch("/api/account/wishlist")).json(),
    enabled,
  });

  if (!sessionLoading && !enabled) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Sign in to see your wishlist"
          description="Save the pieces you love and find them here any time."
          action={
            <Link href="/login?next=/wishlist" className="mt-2 inline-flex h-11 items-center rounded-md bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-dark">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-display-lg font-bold">Your wishlist</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        {data?.products?.length ?? 0} saved piece{(data?.products?.length ?? 0) === 1 ? "" : "s"}
        {" · "}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
          }}
          className="font-semibold text-terracotta hover:underline"
        >
          Copy share link
        </button>
      </p>

      {isLoading || !enabled ? (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-[4/5] rounded-lg" />)}
        </div>
      ) : data?.products?.length ? (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {data.products.map((p) => (
            <ProductCard key={p.id} product={p} region={region} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="Nothing saved yet"
          description="Tap the heart on any piece to keep it here."
          action={
            <Link href="/products" className="mt-2 inline-flex h-11 items-center rounded-md bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-dark">
              Browse products
            </Link>
          }
        />
      )}
    </div>
  );
}
