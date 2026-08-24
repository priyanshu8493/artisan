"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "", orderId: "" });
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orderId: form.orderId || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not send");
      toast.success("Message sent — we reply within one business day.");
      setForm({ name: "", email: "", subject: "", body: "", orderId: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-14">
      <header className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <MessageCircle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-display-lg font-bold">We&apos;d love to hear from you</h1>
        <p className="mt-3 text-[rgb(var(--muted))]">
          Questions about an order, a maker, or selling with us — real humans reply.
        </p>
      </header>

      <form onSubmit={submit} className="mt-10 space-y-4 rounded-lg card-surface p-7 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">Your name</label>
            <input id="c-name" required minLength={2} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none" />
          </div>
          <div>
            <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input id="c-email" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="c-subject" className="mb-1.5 block text-sm font-medium">Subject</label>
          <input id="c-subject" required minLength={2} value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Order question, partnership, press…"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none" />
        </div>
        <div>
          <label htmlFor="c-order" className="mb-1.5 block text-sm font-medium">Order number (optional)</label>
          <input id="c-order" value={form.orderId}
            onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            placeholder="AM-XXXXX-XXXX"
            className="h-11 w-full rounded-md card-surface px-3.5 text-sm uppercase shadow-innerSoft focus:border-terracotta focus:outline-none" />
        </div>
        <div>
          <label htmlFor="c-body" className="mb-1.5 block text-sm font-medium">Message</label>
          <textarea id="c-body" required minLength={10} rows={5} value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full rounded-md card-surface px-3.5 py-3 text-sm shadow-innerSoft focus:border-terracotta focus:outline-none" />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-terracotta font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-60"
        >
          <Mail className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
