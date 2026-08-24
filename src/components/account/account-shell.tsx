"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/reviews", label: "My reviews" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="container-page py-10">
      <h1 className="text-display-lg font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</p>}

      <nav className="no-scrollbar mt-8 flex gap-1 overflow-x-auto rounded-lg card-surface p-1 shadow-subtle" aria-label="Account sections">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal"
                  : "text-[rgb(var(--muted))] hover:bg-sand hover:text-[rgb(var(--text))] dark:hover:bg-charcoal-soft"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
