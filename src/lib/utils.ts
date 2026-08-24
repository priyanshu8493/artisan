import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Deterministic suffix so slugs stay unique without extra queries */
export function uniqueSlug(base: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${slugify(base) || "item"}-${rand}`;
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AM-${stamp}-${rand}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function truncate(text: string, len: number): string {
  if (text.length <= len) return text;
  return text.slice(0, len - 1).trimEnd() + "…";
}
