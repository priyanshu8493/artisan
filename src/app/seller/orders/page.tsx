"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, PackageSearch, Printer } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";

interface SellerOrder {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  placedAt: string;
  status: string;
  itemCount: number;
  itemsValueCents: number;
  shippingMethod: string;
}

const STATUS_TABS = ["", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

export default function SellerOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ orders: SellerOrder[] }>({
    queryKey: ["seller-orders", status, q, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("sort", sort);
      return (await fetch(`/api/seller/orders?${params}`)).json();
    },
  });

  const bulk = useMutation({
    mutationFn: async ({ ids, next }: { ids: string[]; next: string }) => {
      const res = await fetch("/api/seller/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: next }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      toast.success("Orders updated — customers notified where applicable.");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["seller-orders"] });
    },
    onError: () => toast.error("Bulk update failed."),
  });

  const orders = data?.orders ?? [];
  const revenue = useMemo(() => orders.reduce((s, o) => s + o.itemsValueCents, 0), [orders]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            {orders.length} order{orders.length === 1 ? "" : "s"} · ${((revenue / 100) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} in your items
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders by status">
        {STATUS_TABS.map((s) => (
          <button
            key={s || "all"}
            role="tab"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition",
              status === s
                ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal"
                : "card-surface text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            )}
          >
            {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order #, customer or email…" className="pl-9" aria-label="Search orders" />
        </div>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44" aria-label="Sort orders">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-charcoal px-4 py-3 text-sm text-cream shadow-lift animate-fadeUp dark:bg-charcoal-soft">
          <strong>{selected.size} selected</strong>
          <span className="mx-1 h-5 w-px bg-white/20" />
          {["PROCESSING", "SHIPPED", "DELIVERED"].map((s) => (
            <button
              key={s}
              disabled={bulk.isPending}
              onClick={() => bulk.mutate({ ids: [...selected], next: s })}
              className="rounded-md px-3 py-1.5 transition hover:bg-white/10"
            >
              Mark {s.toLowerCase()}
            </button>
          ))}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-cream/70 hover:text-cream">Clear</button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-6 w-6" />}
          title="No orders here yet"
          description="When customers buy your pieces, their orders appear here for fulfilment."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg card-surface shadow-subtle">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-4 py-3"><input type="checkbox" checked={selected.size === orders.length && orders.length > 0} onChange={() => setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)))} aria-label="Select all orders" className="h-4 w-4 accent-terracotta" /></th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Placed</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Your value</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Packing slip</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={cn("border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30", selected.has(o.id) && "bg-terracotta/5")}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} aria-label={`Select order ${o.orderNumber}`} className="h-4 w-4 accent-terracotta" />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/seller/orders/${o.id}`} className="font-semibold text-terracotta hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{o.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[rgb(var(--muted))]">
                    {new Date(o.placedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{o.itemCount}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">${(o.itemsValueCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/seller/orders/${o.id}?print=1`}
                      title="Open & print packing slip"
                      aria-label={`Print packing slip for ${o.orderNumber}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta dark:hover:bg-charcoal-soft"
                    >
                      <Printer className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
