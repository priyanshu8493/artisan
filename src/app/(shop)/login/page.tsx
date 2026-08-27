"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed");
      toast.success(`Welcome back, ${data.name.split(" ")[0]}!`);
      const dest =
        next ||
        (data.role === "ADMIN" ? "/admin" : data.role === "SELLER" ? "/seller" : "/");
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[80vh] max-w-md flex-col justify-center py-16">
      <div className="text-center">
        <Link href="/" className="font-display text-2xl font-bold">Artisan<span className="text-terracotta">.</span></Link>
        <h1 className="mt-6 text-display-md font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Sign in to your account</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-lg card-surface p-7 shadow-card">
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">Password</label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-xs font-medium text-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-md bg-terracotta font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="rounded-md bg-sand/70 px-4 py-3 text-xs leading-relaxed text-[rgb(var(--muted))] dark:bg-charcoal-soft/50">
          <strong>Admin:</strong> rajibdgp2011@gmail.com / <code>Admin@1234</code><br />
          <strong>Demo accounts</strong> (password: <code>Password123!</code>)<br />
          Seller: maya@artisans.market · Customer: customer@demo.com
        </div>

        <p className="text-center text-sm text-[rgb(var(--muted))]">
          New here?{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-terracotta hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
