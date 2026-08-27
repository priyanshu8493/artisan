"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  DollarSign, ShoppingCart, Package, Store, Users, Star,
  AlertTriangle, ArrowRight, MessageSquareWarning,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { RevenueLineChart } from "@/components/seller/charts";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/constants";

interface StatsData {
  stats: {
    monthRevenueCents: number;
    yearRevenueCents: number;
    ordersThisWeek: number;
    pendingOrders: number;
    productsListed: number;
    sellers: number;
    customers: number;
    users: number;
    reviews: number;
    pendingSupport: number;
  };
  statusBreakdown: Record<string, number>;
  monthlyRevenue: { month: string; cents: number }[];
  recentOrders: {
    id: string; orderNumber: string; customer: string;
    placedAt: string; status: string; itemsValueCents: number; itemCount: number;
  }[];
  topProducts: { id: string; title: string; slug: string; salesCount: number; revenueCents: number; imageUrl: string | null }[];
  lowStock: { id: string; title: string; stock: number }[];
}

export default function AdminHomePage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await fetch("/api/admin/stats")).json(),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const s = data.stats;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Marketplace dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Overview of the entire marketplace.</p>
        </div>
        {s.pendingSupport > 0 && (
          <Link
            href="/admin/customers"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-warning/15 px-4 text-sm font-semibold text-warning shadow-subtle transition hover:bg-warning/25"
          >
            <MessageSquareWarning className="h-4 w-4" /> {s.pendingSupport} open support
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Revenue this month" value={`$${(s.monthRevenueCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} sub={`$${(s.yearRevenueCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} this year`} tone="terracotta" />
        <StatCard icon={ShoppingCart} label="Orders this week" value={String(s.ordersThisWeek)} sub={`${s.pendingOrders} pending`} tone="info" />
        <StatCard icon={Package} label="Products listed" value={String(s.productsListed)} sub={`${data.lowStock.length} low stock`} tone="forest" />
        <StatCard icon={Store} label="Sellers" value={String(s.sellers)} sub={`${s.customers} customers`} tone="gold" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MiniStat icon={Users} label="Total users" value={String(s.users)} />
        <MiniStat icon={Star} label="Reviews" value={String(s.reviews)} />
        <MiniStat icon={ShoppingCart} label="Pending orders" value={String(s.pendingOrders)} />
      </div>

      {/* Chart + Orders by status */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Monthly revenue (USD)</CardTitle>
            <Link href="/admin/orders" className="text-xs font-semibold text-terracotta hover:underline">All orders →</Link>
          </CardHeader>
          <CardContent>
            <RevenueLineChart data={data.monthlyRevenue.map((m) => ({ month: m.month, value: m.cents }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Orders by status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ORDER_STATUSES.map((st) => {
              const count = data.statusBreakdown[st] ?? 0;
              const total = Object.values(data.statusBreakdown).reduce((n, c) => n + c, 0) || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <Link
                  key={st}
                  href={`/admin/orders?status=${st}`}
                  className="block"
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{ORDER_STATUS_META[st]?.label ?? st}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-[rgb(var(--muted))]">{count}</span>
                      <OrderStatusBadge status={st} />
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.4)]">
                    <div className="h-full rounded-full bg-terracotta" style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-xs font-semibold text-terracotta hover:underline">All orders →</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                  <th className="px-5 py-2.5 font-semibold">Order</th>
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-5 py-2.5 font-semibold">Items</th>
                  <th className="px-5 py-2.5 font-semibold">Value</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30">
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/admin/orders/${o.id}`} className="text-terracotta hover:underline">{o.orderNumber}</Link>
                      <span className="block text-[11px] text-[rgb(var(--muted))]">
                        {new Date(o.placedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3">{o.customer}</td>
                    <td className="px-5 py-3 tabular-nums">×{o.itemCount}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums">${(o.itemsValueCents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Top sellers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.topProducts.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 font-display text-sm font-bold text-[rgb(var(--muted))]">{i + 1}</span>
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt="" width={36} height={36} className="rounded-md object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-md bg-sand dark:bg-charcoal-soft" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${p.slug}`} target="_blank" className="block truncate text-sm font-medium hover:text-terracotta">
                      {p.title}
                    </Link>
                    <p className="text-xs text-[rgb(var(--muted))]">{p.salesCount} sold · ${(p.revenueCents / 100).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.lowStock.length > 0 && (
            <Card className="border-warning/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning"><AlertTriangle className="h-4 w-4" /> Low stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.lowStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <Link href="/admin/products" className="truncate pr-3 font-medium hover:text-terracotta">{p.title}</Link>
                    <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">{p.stock} left</span>
                  </div>
                ))}
                <Link href="/admin/products" className="mt-1 flex items-center gap-1 pt-1 text-xs font-semibold text-terracotta hover:underline">
                  Manage listings <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone: "terracotta" | "info" | "forest" | "gold";
}) {
  const tones = {
    terracotta: "bg-terracotta/12 text-terracotta",
    info: "bg-info/12 text-info",
    forest: "bg-forest/12 text-forest",
    gold: "bg-gold/15 text-gold",
  };
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-card">
      <CardContent className="flex items-start gap-4 p-5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold leading-none">{value}</p>
          {sub && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sand text-[rgb(var(--muted))] dark:bg-charcoal-soft">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
