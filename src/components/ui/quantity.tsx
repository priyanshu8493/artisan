"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const btn =
    size === "sm"
      ? "h-7 w-7"
      : "h-9 w-9";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md card-surface shadow-innerSoft",
        disabled && "opacity-50 pointer-events-none"
      )}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={cn(btn, "flex items-center justify-center rounded-l-md transition hover:bg-sand dark:hover:bg-charcoal-soft disabled:text-[rgb(var(--muted))]")}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        className={cn(
          "text-center font-medium tabular-nums",
          size === "sm" ? "w-8 text-xs" : "w-10 text-sm"
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={cn(btn, "flex items-center justify-center rounded-r-md transition hover:bg-sand dark:hover:bg-charcoal-soft disabled:text-[rgb(var(--muted))]")}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
