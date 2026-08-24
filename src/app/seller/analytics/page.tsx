"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Download, TrendingUp, Users, Package, DollarSign, Percent } from "lucide-react";
import { Select } from "@/components/ui/input";
import { RevenueLineChart, FunnelBarChart } from "@/components/seller/charts";
import { cn } from "@/lib/utils";

interface Analytics {
  summary: {
    revenueCents: number;
    orderCount: number;
    itemsSold: number;
    avgOrderValueCents: number;
    newCustomers: number;
    repeatCustomers: number;
    conversionRate: number;
  };
  funnel: { views: number; carts: number; purchases: number };
  series: { date: string; cents: number }[];
  topProducts: {
    id: string;
    title: string;
    slug: string;
    salesCount: number;
    revenueCents: number;
    imageUrl: string | null;
  }[];
}

const PERIODS = [
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["90d", "Last 90 days"],
  ["year", "This year"],
  ["all", "All time"],
] as const;

export default function SellerAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["seller-analytics", period],
    queryFn: async () => (await fetch(`/api/seller/analytics?period=${period}`)).json(),
  });

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((p) => ({
        month: p.date,
        value: p.cents, // API already emits dollars
      })),
    [data]
  );

  const funnelData = useMemo(
    () =>
      data
        ? [
            { stage: "Views", count: data.funnel.views },
            { stage: "Added to cart", count: data.funnel.carts },
            { stage: "Purchased", count: data.funnel.purchases },
          ]
        : [],
    [data]
  );

  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Period", PERIODS.find(([p]) => p === period)?.[1] ?? period],
      ["Revenue (USD)", (data.summary.revenueCents / 100).toFixed(2)],
      ["Orders", String(data.summary.orderCount)],
      ["Items sold", String(data.summary.itemsSold)],
      ["Avg order value (USD)", (data.summary.avgOrderValueCents / 100).toFixed(2)],
      ["Conversion rate (%)", String(data.summary.conversionRate)],
      ["New customers", String(data.summary.newCustomers)],
      ["Repeat customers", String(data.summary.repeatCustomers)],
      [],
      ["Top product", "Sales", "Revenue (USD)"],
      ...data.topProducts.map((p) => [p.title, String(p.salesCount), (p.revenueCents / 100).toFixed(2)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="text-sm text-[rgb(var(--muted))]">How your studio is performing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40" aria-label="Reporting period">
            {PERIODS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </Select>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="inline-flex h-10 items-center gap-2 rounded-md card-surface px-4 text-sm font-semibold shadow-subtle transition hover:border-terracotta/50 hover:text-terracotta disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue"
          value={isLoading ? "…" : `$${((data?.summary.revenueCents ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
        <StatCard icon={<Package className="h-5 w-5" />} label="Orders" value={isLoading ? "…" : String(data?.summary.orderCount ?? 0)} sub={`${data?.summary.itemsSold ?? 0} items`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg order" value={isLoading ? "…" : `$${((data?.summary.avgOrderValueCents ?? 0) / 100).toFixed(2)}`} />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Conversion" value={isLoading ? "…" : `${data?.summary.conversionRate ?? 0}%`} sub="views → orders" />
      </div>

      {/* Revenue chart */}
      <section className="rounded-lg card-surface p-5 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold">Revenue over time (USD)</h2>
        {chartData.length > 1 ? (
          <RevenueLineChart data={chartData} />
        ) : (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">Not enough data in this range yet.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <section className="rounded-lg card-surface p-5 shadow-subtle">
          <h2 className="mb-3 text-sm font-semibold">Shopper funnel</h2>
          <FunnelBarChart data={funnelData} />
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[rgb(var(--muted))]">
            <div><dt>Cart rate</dt><dd className="font-bold text-[rgb(var(--fg))]">{data && data.funnel.views ? Math.round((data.funnel.carts / data.funnel.views) * 1000) / 10 : 0}%</dd></div>
            <div><dt>Checkout rate</dt><dd className="font-bold text-[rgb(var(--fg))]">{data && data.funnel.carts ? Math.round((data.funnel.purchases / data.funnel.carts) * 1000) / 10 : 0}%</dd></div>
            <div><dt>View→buy</dt><dd className="font-bold text-[rgb(var(--fg))]">{data?.summary.conversionRate ?? 0}%</dd></div>
          </dl>
        </section>

        {/* Customers */}
        <section className="rounded-lg card-surface p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-terracotta" /> Customers</h2>
          <div className="mt-4 space-y-4">
            <CustomerBar label="New customers" value={data?.summary.newCustomers ?? 0} total={(data?.summary.newCustomers ?? 0) + (data?.summary.repeatCustomers ?? 0)} color="#3E7C4F" />
            <CustomerBar label="Repeat customers" value={data?.summary.repeatCustomers ?? 0} total={(data?.summary.newCustomers ?? 0) + (data?.summary.repeatCustomers ?? 0)} color="#B98A38" />
          </div>
          <p className="mt-4 rounded-md bg-sand/60 p-3 text-xs leading-relaxed text-[rgb(var(--muted))] dark:bg-charcoal-soft/40">
            Repeat buyers are the heartbeat of an artisan shop — a handwritten thank-you note goes a long way.
          </p>
        </section>
      </div>

      {/* Top products */}
      <section className="rounded-lg card-surface shadow-subtle">
        <h2 className="border-b border-[rgb(var(--line)/0.6)] px-5 py-3.5 text-sm font-semibold">Best sellers</h2>
        {isLoading ? (
          <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-md" />)}</div>
        ) : (data?.topProducts.length ?? 0) === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[rgb(var(--muted))]">No sales yet — share your shop link to get started.</p>
        ) : (
          <ul role="list" className="divide-y divide-[rgb(var(--line)/0.4)]">
            {(data?.topProducts ?? []).map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 font-display text-lg font-bold text-[rgb(var(--muted))]">{i + 1}</span>
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt="" width={44} height={44} className="shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="h-11 w-11 shrink-0 rounded-md bg-sand dark:bg-charcoal-soft" />
                )}
                <Link href={`/products/${p.slug}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-terracotta">{p.title}</Link>
                <span className="text-sm tabular-nums text-[rgb(var(--muted))]">{p.salesCount} sold</span>
                <span className="w-24 text-right text-sm font-semibold tabular-nums">${(p.revenueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg card-surface p-4 shadow-subtle transition hover:shadow-card">
      <div className="flex items-center gap-2 text-[rgb(var(--muted))]">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[rgb(var(--muted))]">{sub}</p>}
    </div>
  );
}

function CustomerBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">{value} <span className="text-xs text-[rgb(var(--muted))]">({pct}%)</span></span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-sand dark:bg-charcoal-soft" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total || undefined} aria-label={label}>
        <div className={cn("h-full rounded-full transition-all duration-700")} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
