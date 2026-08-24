"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  DollarSign, ShoppingCart, Package, TrendingUp, Bell,
  ArrowRight, Plus, AlertTriangle, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { RevenueLineChart } from "@/components/seller/charts";

interface StatsData {
  stats: {
    monthRevenueCents: number;
    yearRevenueCents: number;
    ordersThisWeek: number;
    pendingOrders: number;
    productsListed: number;
  };
  monthlyRevenue: { month: string; cents: number }[];
  recentOrders: {
    id: string; orderNumber: string; customer: string;
    placedAt: string; status: string; itemsValueCents: number; itemCount: number;
  }[];
  topProducts: { id: string; title: string; slug: string; salesCount: number; revenueCents: number; imageUrl: string | null }[];
  lowStock: { id: string; title: string; stock: number }[];
  unreadNotifications: number;
}

export default function SellerHomePage() {
  const { data, isLoading } = useQuery<StatsData>({
    queryKey: ["seller-stats"],
    queryFn: async () => (await fetch("/api/seller/stats")).json(),
    refetchInterval: 60_000,
  });

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await fetch("/api/seller/notifications")).json(),
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
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Here&apos;s how your studio is doing.</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/seller/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-terracotta px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark"
          >
            <Plus className="h-4 w-4" /> Add product
          </Link>
          <Link
            href="/seller/orders?status=PENDING"
            className="inline-flex h-10 items-center rounded-md card-surface px-4 text-sm font-semibold shadow-subtle transition hover:border-terracotta/40"
          >
            View orders
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Revenue this month" value={`$${(s.monthRevenueCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} sub={`$${(s.yearRevenueCents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} this year`} tone="terracotta" />
        <StatCard icon={ShoppingCart} label="Orders this week" value={String(s.ordersThisWeek)} sub={`${s.pendingOrders} pending`} tone="info" />
        <StatCard icon={Package} label="Products listed" value={String(s.productsListed)} sub={`${data.lowStock.length} low stock`} tone="forest" />
        <StatCard icon={TrendingUp} label="Avg. monthly growth" value={
          (() => {
            const m = data.monthlyRevenue.map((x) => x.cents);
            const prev = m[m.length - 2] ?? 0;
            const curr = m[m.length - 1] ?? 0;
            return prev > 0 ? `${Math.round(((curr - prev) / prev) * 100)}%` : "—";
          })()
        } sub="vs last month" tone="gold" />
      </div>

      {/* Chart + Notifications */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Monthly revenue (USD)</CardTitle>
            <Link href="/seller/analytics" className="text-xs font-semibold text-terracotta hover:underline">
              Full analytics →
            </Link>
          </CardHeader>
          <CardContent>
            <RevenueLineChart data={data.monthlyRevenue.map((m) => ({ month: m.month, value: m.cents }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-terracotta" /> Notifications</CardTitle>
            {data.unreadNotifications > 0 && (
              <span className="rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-white">{data.unreadNotifications}</span>
            )}
          </CardHeader>
          <CardContent className="max-h-72 space-y-2 overflow-y-auto">
            {(notifications.data?.notifications ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-[rgb(var(--muted))]">You&apos;re all caught up ✨</p>
            ) : (
              (notifications.data?.notifications ?? []).slice(0, 6).map((n: any) => (
                <Link
                  key={n.id}
                  href={n.link ?? "/seller"}
                  onClick={() =>
                    fetch("/api/seller/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }).then(() => notifications.refetch())
                  }
                  className={`block rounded-md border p-3 transition hover:shadow-subtle ${!n.read ? "border-terracotta/40 bg-terracotta/5" : "border-[rgb(var(--line)/0.6)]"}`}
                >
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-[rgb(var(--muted))]">{n.body}</p>}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/seller/orders" className="text-xs font-semibold text-terracotta hover:underline">All orders →</Link>
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
                      <Link href={`/seller/orders/${o.id}`} className="text-terracotta hover:underline">{o.orderNumber}</Link>
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
            <CardHeader><CardTitle>Top performers</CardTitle></CardHeader>
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
                {data.lowStock.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <Link href="/seller/products" className="truncate pr-3 font-medium hover:text-terracotta">{p.title}</Link>
                    <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-warning">{p.stock} left</span>
                  </div>
                ))}
                <Link href="/seller/products" className="mt-1 flex items-center gap-1 pt-1 text-xs font-semibold text-terracotta hover:underline">
                  Restock now <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {(() => {
            const newReviews = (notifications.data?.notifications ?? []).filter((n: any) => n.type === "REVIEW");
            return newReviews.length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-4 w-4 text-gold" /> New reviews</CardTitle></CardHeader>
                <CardContent>
                  {newReviews.slice(0, 3).map((n: any) => (
                    <p key={n.id} className="text-sm text-[rgb(var(--muted))]">{n.body}</p>
                  ))}
                  <Link href="/seller/reviews" className="mt-2 block text-xs font-semibold text-terracotta hover:underline">Respond to reviews →</Link>
                </CardContent>
              </Card>
            ) : null;
          })()}
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
