"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Star, Settings, MessageSquare, ExternalLink, Menu, X, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/seller/reviews", label: "Reviews", icon: Star },
  { href: "/seller/messages", label: "Messages", icon: MessageSquare },
  { href: "/seller/settings", label: "Settings", icon: Settings },
];

export function SellerSidebar({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-terracotta text-white shadow-subtle"
                : "text-cream/70 hover:bg-charcoal-soft hover:text-cream"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-charcoal px-4 text-cream lg:hidden print-hidden">
        <span className="font-display text-lg font-bold">Artisan<span className="text-terracotta-light">.</span> Studio</span>
        <button onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div className="h-14 lg:hidden" />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-charcoal transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print-hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/10 p-4">
          <p className="font-display text-xl font-bold text-cream">Artisan<span className="text-terracotta-light">.</span></p>
          <div className="mt-2 flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="truncate text-xs font-semibold text-cream/90">{shopName}&apos;s studio</span>
            <Link
              href="/"
              target="_blank"
              title="View storefront"
              className="shrink-0 rounded p-1 text-cream/60 transition hover:text-terracotta-light"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        {nav}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-cream/70 transition hover:bg-error/20 hover:text-error"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
    </>
  );
}
