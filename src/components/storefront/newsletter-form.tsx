"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Subscription failed");
      }
      toast.success("Welcome to the letter — check your inbox soon.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "flex gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        className="h-11 flex-1 rounded-md card-surface px-4 text-sm shadow-innerSoft placeholder:text-[rgb(var(--muted))] focus:border-terracotta focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-charcoal px-5 text-sm font-semibold text-cream shadow-subtle transition hover:bg-charcoal-soft disabled:opacity-60 dark:bg-cream dark:text-charcoal dark:hover:brightness-95"
      >
        {loading ? "Joining…" : "Subscribe"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
