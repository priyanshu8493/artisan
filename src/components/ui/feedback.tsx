import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value,
  size = 14,
  className,
  showValue = false,
}: {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= rounded
              ? "fill-gold text-gold"
              : i - 0.5 === rounded
                ? "fill-gold/40 text-gold"
                : "text-[rgb(var(--line))] dark:text-charcoal-muted"
          }
          aria-hidden
        />
      ))}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-[rgb(var(--muted))]">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className ?? ""}`} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sand dark:bg-charcoal-soft text-terracotta">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[rgb(var(--muted))]">{description}</p>
      )}
      {action}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
