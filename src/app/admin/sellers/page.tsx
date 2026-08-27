"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Store, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface AdminSeller {
  id: string;
  shopName: string;
  slug: string;
  tagline: string | null;
  city: string | null;
  country: string | null;
  featured: boolean;
  logoUrl: string | null;
  email: string;
  ownerName: string;
  joinedAt: string;
  productCount: number;
}

export default function AdminSellersPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ sellers: AdminSeller[] }>({
    queryKey: ["admin-sellers"],
    queryFn: async () => (await fetch("/api/admin/sellers")).json(),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "featured", featured }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Action failed");
    },
    onSuccess: (_d, v) => {
      toast.success(v.featured ? "Seller featured on homepage" : "Removed from featured");
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sellers = data?.sellers ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Sellers</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{sellers.length} seller studios on the marketplace</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-lg" />)}</div>
      ) : sellers.length === 0 ? (
        <EmptyState icon={<Store className="h-6 w-6" />} title="No sellers yet" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((s) => (
            <div key={s.id} className="flex flex-col gap-4 rounded-lg card-surface p-5 shadow-subtle transition hover:shadow-card">
              <div className="flex items-center gap-3">
                {s.logoUrl ? (
                  <Image src={s.logoUrl} alt="" width={48} height={48} className="shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sand text-[rgb(var(--muted))] dark:bg-charcoal-soft"><Store className="h-5 w-5" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/artisans/${s.slug}`} target="_blank" className="truncate font-display text-lg font-bold hover:text-terracotta">{s.shopName}</Link>
                  {s.tagline && <p className="truncate text-xs text-[rgb(var(--muted))]">{s.tagline}</p>}
                </div>
                <button
                  onClick={() => toggleFeatured.mutate({ id: s.id, featured: !s.featured })}
                  title={s.featured ? "Unfeature" : "Feature"}
                  aria-label={s.featured ? "Unfeature" : "Feature"}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-sand dark:hover:bg-charcoal-soft", s.featured ? "text-gold" : "text-[rgb(var(--muted))] hover:text-gold")}
                >
                  {s.featured ? <Star className="h-5 w-5 fill-gold text-gold" /> : <StarOff className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-auto space-y-1 text-sm text-[rgb(var(--muted))]">
                <p>Owner: <span className="font-medium text-[rgb(var(--text))]">{s.ownerName}</span></p>
                <p className="truncate">{s.email}</p>
                <p>{s.city ? `${s.city}, ` : ""}{s.country} · {s.productCount} products · {new Date(s.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
              </div>
              <div className="flex gap-2 border-t border-[rgb(var(--line)/0.5)] pt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(`/artisans/${s.slug}`, "_blank")}>
                  View shop
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
