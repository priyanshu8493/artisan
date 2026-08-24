import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-[rgb(var(--muted))]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="transition hover:text-terracotta">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-[rgb(var(--text))]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
