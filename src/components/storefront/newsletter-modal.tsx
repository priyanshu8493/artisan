"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { NewsletterForm } from "./newsletter-form";

export function NewsletterModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("newsletter-dismissed")) return;
    const t = setTimeout(() => setOpen(true), 9000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem("newsletter-dismissed", "1");
    setOpen(false);
  }

  return (
    <Modal open={open} onClose={dismiss} labelledBy="newsletter-modal-title">
      <div className="overflow-hidden rounded-lg">
        <div className="bg-gradient-to-br from-terracotta via-terracotta-dark to-indigo-deep p-8 pb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/80">The Maker&apos;s Letter</p>
          <h3 id="newsletter-modal-title" className="mt-3 font-display text-2xl font-bold text-white">
            Stories from the studio, twice a month
          </h3>
        </div>
        <div className="p-6">
          <p className="mb-5 text-center text-sm leading-relaxed text-[rgb(var(--muted))]">
            New collections, artisan interviews and early access to limited runs.
            No noise — we promise.
          </p>
          <NewsletterForm compact />
          <button
            onClick={dismiss}
            className="mx-auto mt-4 block text-xs font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--text))]"
          >
            No thanks, maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
