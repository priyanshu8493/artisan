"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  LayoutGrid, List, Plus, Search, Pencil, Trash2,
  Copy, Eye, MoreHorizontal, Package,
} from "lucide-react";
import { ProductStatusBadge, StockBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface SellerProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  status: string;
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
  categoryName: string;
  imageUrl: string | null;
  salesCount: number;
  variantCount: number;
  variantStock: number;
}

export default function SellerProductsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("table");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ products: SellerProduct[] }>({
    queryKey: ["seller-products", status, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      return (await fetch(`/api/seller/products?${params}`)).json();
    },
  });

  const quickOp = useMutation({
    mutationFn: async ({ ids, op, value }: { ids: string[]; op: string; value?: any }) => {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/seller/products/${id}`, {
            method: op === "delete" ? "DELETE" : "PUT",
            headers: { "Content-Type": "application/json" },
            ...(op !== "delete" ? { body: JSON.stringify(op === "status" ? { op: "status", status: value } : { op }) } : {}),
          })
        )
      );
      if (results.some((r) => !r.ok)) throw new Error();
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.op === "delete"
          ? `${vars.ids.length > 1 ? `${vars.ids.length} products` : "Product"} deleted`
          : `Done — ${vars.ids.length} product${vars.ids.length === 1 ? "" : "s"} updated`
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["seller-products"] });
    },
    onError: () => {
      toast.error("Some actions failed — products attached to orders are deactivated instead of deleted.");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["seller-products"] });
    },
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    const all = data?.products ?? [];
    setSelected((prev) =>
      prev.size === all.length ? new Set() : new Set(all.map((p) => p.id))
    );
  }

  const products = data?.products ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-sm text-[rgb(var(--muted))]">{products.length} items in your catalogue</p>
        </div>
        <Link
          href="/seller/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-terracotta px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
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
        <div className="flex rounded-md card-surface p-0.5 shadow-innerSoft">
          {([["table", List], ["grid", LayoutGrid]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              aria-pressed={view === v}
              className={cn("flex h-8 w-8 items-center justify-center rounded-sm transition", view === v ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal" : "text-[rgb(var(--muted))]")}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-charcoal px-4 py-3 text-sm text-cream shadow-lift animate-fadeUp dark:bg-charcoal-soft">
          <strong>{selected.size} selected</strong>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <button onClick={() => quickOp.mutate({ ids: [...selected], op: "status", value: "ACTIVE" })} disabled={quickOp.isPending} className="rounded-md px-3 py-1.5 transition hover:bg-white/10">Activate</button>
          <button onClick={() => quickOp.mutate({ ids: [...selected], op: "status", value: "INACTIVE" })} disabled={quickOp.isPending} className="rounded-md px-3 py-1.5 transition hover:bg-white/10">Deactivate</button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selected.size} product(s)? Items in past orders will be hidden instead.`))
                quickOp.mutate({ ids: [...selected], op: "delete" });
            }}
            disabled={quickOp.isPending}
            className="rounded-md px-3 py-1.5 text-error transition hover:bg-error/30"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-cream/70 hover:text-cream">Clear</button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        view === "table" ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-lg" />)}</div>
        )
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No products yet"
          description="List your first handmade piece and it'll appear on the storefront instantly."
          action={
            <Link href="/seller/products/new" className="mt-2 inline-flex h-11 items-center gap-2 rounded-md bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-dark">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          }
        />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-lg card-surface shadow-subtle">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-4 py-3"><input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-terracotta" /></th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Inventory</th>
                <th className="px-4 py-3 font-semibold">Sold</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const totalStock = p.stock + p.variantStock;
                return (
                  <tr key={p.id} className={cn("border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30", selected.has(p.id) && "bg-terracotta/5")}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} className="h-4 w-4 accent-terracotta" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt="" width={40} height={40} className="shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sand text-[rgb(var(--muted))] dark:bg-charcoal-soft"><Package className="h-4 w-4" /></span>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate font-medium">{p.title}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">{p.categoryName}{p.sku && ` · ${p.sku}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 font-semibold tabular-nums">${(p.priceCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3"><StockBadge stock={totalStock} threshold={p.lowStockThreshold} /></td>
                    <td className="px-4 py-3 tabular-nums">{p.salesCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label="Edit" href={`/seller/products/${p.id}/edit`}><Pencil className="h-4 w-4" /></IconAction>
                        <IconAction label="View on storefront" href={`/products/${p.slug}`} external><Eye className="h-4 w-4" /></IconAction>
                        <div className="relative">
                          <IconAction label="More" onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}><MoreHorizontal className="h-4 w-4" /></IconAction>
                          {menuOpen === p.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg card-surface p-1 shadow-lift">
                                <MenuItem onClick={() => { setMenuOpen(null); quickOp.mutate({ ids: [p.id], op: "duplicate" }); }}>
                                  <Copy className="h-4 w-4" /> Duplicate
                                </MenuItem>
                                <MenuItem danger onClick={() => { setMenuOpen(null); if (confirm(`Delete "${p.title}"?`)) quickOp.mutate({ ids: [p.id], op: "delete" }); }}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </MenuItem>
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
      ) : (
        /* Grid view */
        <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const totalStock = p.stock + p.variantStock;
            return (
              <div key={p.id} className={cn("group overflow-hidden rounded-lg card-surface shadow-subtle transition hover:shadow-card", selected.has(p.id) && "ring-2 ring-terracotta")}>
                <div className="relative aspect-square bg-sand dark:bg-charcoal-soft">
                  {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="280px" className="object-cover" />}
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.title}`}
                    className="absolute left-2 top-2 h-4 w-4 accent-terracotta"
                  />
                  <span className="absolute right-2 top-2"><ProductStatusBadge status={p.status} /></span>
                </div>
                <div className="space-y-2 p-4">
                  <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">${(p.priceCents / 100).toFixed(2)}</span>
                    <StockBadge stock={totalStock} threshold={p.lowStockThreshold} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/seller/products/${p.id}/edit`} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md card-surface text-xs font-semibold transition hover:border-terracotta/50 hover:text-terracotta">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <Link href={`/products/${p.slug}`} target="_blank" className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md card-surface text-xs font-semibold transition hover:border-terracotta/50 hover:text-terracotta">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  href,
  external,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}) {
  const cls =
    "flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta dark:hover:bg-charcoal-soft";
  if (href)
    return (
      <a
        href={href}
        title={label}
        aria-label={label}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className={cls}
      >
        {children}
      </a>
    );
  return (
    <button onClick={onClick} title={label} aria-label={label} className={cls}>
      {children}
    </button>
  );
}

function MenuItem({
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
