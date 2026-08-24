"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

/** Client-side wishlist toggle synced with the API. Returns current ids for optimistic UI. */
export function useWishlist(userId?: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) return;
    fetch("/api/account/wishlist")
      .then((r) => (r.ok ? r.json() : { productIds: [] }))
      .then((d) => setIds(d.productIds ?? []))
      .catch(() => {});
  }, [userId]);

  async function toggle(productId: string) {
    if (!userId) {
      toast.info("Sign in to save favourites");
      return false;
    }
    const wasSaved = ids.includes(productId);
    setIds((prev) => (wasSaved ? prev.filter((id) => id !== productId) : [...prev, productId]));
    startTransition(() => {});
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      toast.success(d.saved ? "Saved to your favourites" : "Removed from favourites");
      return d.saved as boolean;
    } catch {
      setIds((prev) => (wasSaved ? [...prev, productId] : prev.filter((id) => id !== productId)));
      toast.error("Could not update favourites");
      return !wasSaved;
    }
  }

  return { ids, toggle, pending };
}
