"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Store, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [role, setRole] = useState<"CUSTOMER" | "SELLER">(
    params.get("role") === "seller" ? "SELLER" : "CUSTOMER"
  );
  const [form, setForm] = useState({ name: "", email: "", password: "", shopName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError("Password needs 8+ characters with at least one letter and number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      toast.success(role === "SELLER" ? "Your shop is ready! Welcome aboard." : "Welcome to Artisan Market!");
      router.push(role === "SELLER" ? "/seller" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[80vh] max-w-md flex-col justify-center py-16">
      <div className="text-center">
        <Link href="/" className="font-display text-2xl font-bold">Artisan<span className="text-terracotta">.</span></Link>
        <h1 className="mt-6 text-display-md font-bold">Join Artisan Market</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Shop unique craft, or open your own studio shop.</p>
      </div>

      {/* Role selector */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {([
          ["CUSTOMER", ShoppingBag, "I love handmade", "Shop one-of-a-kind pieces"],
          ["SELLER", Store, "I make handmade", "Open a shop & start selling"],
        ] as const).map(([value, Icon, title, desc]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={cn(
              "rounded-lg border-2 p-4 text-left transition",
              role === value
                ? "border-terracotta bg-terracotta/5"
                : "card-surface hover:border-terracotta/40"
            )}
            aria-pressed={role === value}
          >
            <Icon className={`h-5 w-5 ${role === value ? "text-terracotta" : "text-[rgb(var(--muted))]"}`} />
            <span className="mt-2 block text-sm font-bold">{title}</span>
            <span className="block text-xs text-[rgb(var(--muted))]">{desc}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-lg card-surface p-7 shadow-card">
        {role === "SELLER" && (
          <div>
            <label htmlFor="reg-shop" className="mb-1.5 block text-sm font-medium">Shop name</label>
            <input
              id="reg-shop"
              required
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              placeholder="e.g. Willow & Kiln Ceramics"
              className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
            />
          </div>
        )}
        <div>
          <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium">Full name</label>
          <input
            id="reg-name"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            id="reg-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium">Password</label>
          <input
            id="reg-password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-[rgb(var(--muted))]">8+ characters, with a letter and a number.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-xs font-medium text-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-md bg-terracotta font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark disabled:opacity-60"
        >
          {loading ? "Creating your account…" : role === "SELLER" ? "Open my shop" : "Create account"}
        </button>
        <p className="text-center text-xs leading-relaxed text-[rgb(var(--muted))]">
          By joining you agree to our{" "}
          <Link href="/terms" className="underline hover:text-terracotta">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-terracotta">Privacy Policy</Link>.
        </p>
        <p className="text-center text-sm text-[rgb(var(--muted))]">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-terracotta hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
