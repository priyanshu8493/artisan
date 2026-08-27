"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search, Trash2, MoreHorizontal, Eye, Package, Star, StarOff,
} from "lucide-react";
import { ProductStatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  status: string;
  featured: boolean;
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
  categoryName: string;
  sellerName: string;
  imageUrl: string | null;
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  variantStock: number;
}

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ products: AdminProduct[] }>({
    queryKey: ["admin-products", status, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      return (await fetch(`/api/admin/products?${params}`)).json();
    },
  });

  const quickOp = useMutation({
    mutationFn: async ({
      id, op, value,
    }: { id: string; op: "status" | "featured" | "delete"; value?: any }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: op === "delete" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        ...(op !== "delete" ? { body: JSON.stringify({ op, ...(op === "status" ? { status: value } : { featured: value }) }) } : {}),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Action failed");
    },
    onSuccess: (_d, v) => {
      toast.success(
        v.op === "delete" ? "Product deleted" : v.op === "featured" ? (v.value ? "Marked as featured" : "Removed from featured") : `Set to ${v.value.toLowerCase()}`
      );
      setMenuOpen(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => {
      toast.error("Action failed — items attached to orders are deactivated instead of deleted.");
      setMenuOpen(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const products = data?.products ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">All listings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{products.length} products across the marketplace</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or SKU…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No listings found"
          description="Adjust your filter or search to see products."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg card-surface shadow-subtle">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Seller</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Sold</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const totalStock = p.stock + p.variantStock;
                return (
                  <tr key={p.id} className="border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt="" width={40} height={40} className="shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sand text-[rgb(var(--muted))] dark:bg-charcoal-soft"><Package className="h-4 w-4" /></span>
                        )}
                        <div className="min-w-0">
                          <p className="flex max-w-[220px] items-center gap-1.5 truncate font-medium">
                            {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" aria-label="Featured" />}
                            {p.title}
                          </p>
                          <p className="text-xs text-[rgb(var(--muted))]">{p.categoryName}{p.sku && ` · ${p.sku}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/admin/sellers" className="font-medium text-terracotta hover:underline">{p.sellerName}</Link>
                    </td>
                    <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">${(p.priceCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">{totalStock}</td>
                    <td className="px-4 py-3 tabular-nums">{p.salesCount}</td>
                    <td className="px-4 py-3 tabular-nums">{p.ratingCount > 0 ? `${p.ratingAvg}★` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" title="View on storefront" aria-label="View on storefront" className="flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta dark:hover:bg-charcoal-soft">
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => quickOp.mutate({ id: p.id, op: "featured", value: !p.featured })}
                          title={p.featured ? "Unfeature" : "Feature"}
                          aria-label={p.featured ? "Unfeature" : "Feature"}
                          className={cn("flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-sand dark:hover:bg-charcoal-soft", p.featured ? "text-gold" : "text-[rgb(var(--muted))] hover:text-gold")}
                        >
                          {p.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                        </button>
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} title="More" aria-label="More actions" className="flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta dark:hover:bg-charcoal-soft">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpen === p.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg card-surface p-1 shadow-lift">
                                <MenuBtn onClick={() => quickOp.mutate({ id: p.id, op: "status", value: "ACTIVE" })}>Activate</MenuBtn>
                                <MenuBtn onClick={() => quickOp.mutate({ id: p.id, op: "status", value: "DRAFT" })}>Set to draft</MenuBtn>
                                <MenuBtn onClick={() => quickOp.mutate({ id: p.id, op: "status", value: "INACTIVE" })}>Deactivate</MenuBtn>
                                <MenuBtn danger onClick={() => { setMenuOpen(null); if (confirm(`Delete "${p.title}"?`)) quickOp.mutate({ id: p.id, op: "delete" }); }}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </MenuBtn>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MenuBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition",
        danger ? "text-error hover:bg-error/10" : "hover:bg-sand dark:hover:bg-charcoal-soft"
      )}
    >
      {children}
    </button>
  );
}
