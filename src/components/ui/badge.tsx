import * as React from "react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_META, PRODUCT_STATUS_META } from "@/lib/constants";

type Tone = "neutral" | "info" | "success" | "warning" | "error" | "terracotta" | "gold";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[rgb(var(--line)/0.5)] text-[rgb(var(--muted))]",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/10 text-error",
  terracotta: "bg-terracotta/12 text-terracotta",
  gold: "bg-gold/15 text-gold",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: string }) {
  const meta = PRODUCT_STATUS_META[status] ?? { label: status, tone: "neutral" };
  return (
    <Badge tone={(meta.tone as Tone) ?? "neutral"}>{meta.label}</Badge>
  );
}

export function StockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold?: number;
}) {
  if (stock === 0)
    return <Badge tone="error">Out of stock</Badge>;
  if (threshold !== undefined && stock <= threshold)
    return <Badge tone="warning">Low · {stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}
