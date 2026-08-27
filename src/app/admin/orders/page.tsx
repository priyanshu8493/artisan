"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { ORDER_STATUSES } from "@/lib/constants";

interface AdminOrder {
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

function OrdersView() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ["admin-orders", status, q],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      if (q) sp.set("q", q);
      return (await fetch(`/api/admin/orders?${sp}`)).json();
    },
  });

  const orders = data?.orders ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{orders.length} orders on the marketplace</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, customer…" className="pl-9" aria-label="Search orders" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" aria-label="Filter by status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-md" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="No orders found" description="Try a different filter or search." />
      ) : (
        <div className="overflow-x-auto rounded-lg card-surface shadow-subtle">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold">Value</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-terracotta hover:underline">{o.orderNumber}</Link>
                    <span className="block text-[11px] text-[rgb(var(--muted))]">
                      {new Date(o.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-5 py-3">{o.customer}</td>
                  <td className="px-5 py-3 text-[rgb(var(--muted))]">{o.email}</td>
                  <td className="px-5 py-3 tabular-nums">×{o.itemCount}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">${(o.itemsValueCents / 100).toFixed(2)}</td>
                  <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
