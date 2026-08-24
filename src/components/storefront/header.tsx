"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  LogOut, Package, Store, Sun, Moon, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useSession } from "@/hooks/use-session";
import { cookies } from "@/lib/client-cookies";

const NAV = [
  { href: "/products", label: "Shop All" },
  { href: "/products?category=pottery-ceramics", label: "Pottery" },
  { href: "/products?category=textiles-weaving", label: "Textiles" },
  { href: "/products?category=jewelry", label: "Jewelry" },
  { href: "/artisans", label: "Artisans" },
];

function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--muted))] transition hover:bg-sand hover:text-[rgb(var(--text))] dark:hover:bg-charcoal-soft"
    >
      {dark ? <Sun className="h-4.5 w-4.5 h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function RegionSelector({ region }: { region: string }) {
  const router = useRouter();
  function setRegion(next: string) {
    document.cookie = `region=${next}; path=/; max-age=${60 * 60 * 24 * 180}`;
    router.refresh();
  }
  return (
    <label className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted))]" aria-label="Shipping region">
      <Globe className="h-4 w-4" />
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="cursor-pointer bg-transparent py-1 pr-1 font-medium text-[rgb(var(--text))] focus:outline-none [&>option]:text-charcoal"
      >
        <option value="US">🇺🇸 USD</option>
        <option value="GB">🇬🇧 GBP</option>
      </select>
    </label>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const { user } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const region = (typeof window !== "undefined" && cookies.get("region")) || "US";

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    setMobileOpen(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[rgb(var(--line)/0.6)] bg-[rgb(var(--bg)/0.85)] backdrop-blur-md print-hidden">
      {/* Announcement bar */}
      <div className="bg-charcoal dark:bg-black/40 px-4 py-2 text-center text-xs tracking-wide text-cream/90">
        Free standard shipping on orders over $75 · Handmade with love in the US & UK
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Artisan<span className="text-terracotta">.</span>
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-[rgb(var(--muted))] lg:block">
            Market
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {NAV.map((item) => {
            const base = item.href.split("?")[0];
            const active = pathname === base;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-terracotta after:transition-all hover:after:w-full",
                  active ? "after:w-full text-terracotta" : "hover:text-terracotta"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <form onSubmit={onSearch} role="search" className="relative hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search handmade goods…"
            aria-label="Search products"
            className="h-9 w-full rounded-full card-surface pl-9 pr-4 text-sm shadow-innerSoft placeholder:text-[rgb(var(--muted))] focus:border-terracotta focus:outline-none"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <div className="hidden xl:block"><RegionSelector region={region} /></div>
          <ThemeToggle />

          {user?.role === "SELLER" && (
            <Link
              href="/seller"
              aria-label="Seller dashboard"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--muted))] transition hover:bg-sand hover:text-[rgb(var(--text))] sm:flex dark:hover:bg-charcoal-soft"
            >
              <Store className="h-5 w-5" />
            </Link>
          )}

          {user && (
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--muted))] transition hover:bg-sand hover:text-terracotta sm:flex dark:hover:bg-charcoal-soft"
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}

          {user ? (
            <div className="group relative">
              <button
                aria-label="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--muted))] transition hover:bg-sand hover:text-[rgb(var(--text))] dark:hover:bg-charcoal-soft"
              >
                <User className="h-5 w-5" />
              </button>
              <div className="invisible absolute right-0 top-full w-48 translate-y-1 rounded-lg card-surface p-1.5 opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <p className="truncate border-b border-[rgb(var(--line)/0.6)] px-3 pb-2 pt-2 text-xs text-[rgb(var(--muted))]">
                  {user.name}
                </p>
                <Link href="/account" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-sand dark:hover:bg-charcoal-soft">
                  <User className="h-4 w-4" /> My account
                </Link>
                <Link href="/account/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-sand dark:hover:bg-charcoal-soft">
                  <Package className="h-4 w-4" /> Orders
                </Link>
                {user.role === "SELLER" && (
                  <Link href="/seller" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-sand dark:hover:bg-charcoal-soft">
                    <Store className="h-4 w-4" /> Seller dashboard
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error transition hover:bg-error/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-full px-4 text-sm font-medium text-[rgb(var(--text))] transition hover:bg-sand sm:flex dark:hover:bg-charcoal-soft"
            >
              Sign in
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={`Shopping cart${count ? `, ${count} items` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--text))] transition hover:bg-sand dark:hover:bg-charcoal-soft"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white animate-fadeUp">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <button
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--text))] transition hover:bg-sand lg:hidden dark:hover:bg-charcoal-soft"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-[rgb(var(--line)/0.6)] bg-[rgb(var(--bg))] lg:hidden">
          <form onSubmit={onSearch} role="search" className="relative container-page py-3 md:hidden">
            <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search handmade goods…"
              aria-label="Search products"
              className="h-10 w-full rounded-full card-surface pl-10 pr-4 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
            />
          </form>
          <nav className="container-page grid gap-1 pb-4" aria-label="Mobile navigation">
            {[...NAV, { href: user ? "/wishlist" : "/login", label: user ? "Wishlist" : "Sign in" }, ...(user?.role === "SELLER" ? [{ href: "/seller", label: "Seller Dashboard" }] : [])].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium transition hover:bg-sand dark:hover:bg-charcoal-soft"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-[rgb(var(--line)/0.6)] pt-3">
              <RegionSelector region={region} />
              {user && (
                <button onClick={logout} className="text-sm font-medium text-error">
                  Sign out
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
