"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  {
    eyebrow: "New this season",
    title: "Objects with a heartbeat",
    subtitle:
      "Hand-thrown ceramics, naturally dyed textiles and forged metals — made slowly, by hand, by makers who sign their work.",
    cta: "Explore the collection",
    href: "/products",
  },
  {
    eyebrow: "Crafted by local artisans",
    title: "Every piece tells a story",
    subtitle:
      "From Hudson Valley kilns to Cornish glass studios, meet the people behind the objects you live with.",
    cta: "Meet our artisans",
    href: "/artisans",
  },
];

export function Hero({ heroImageUrl }: { heroImageUrl: string }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const current = SLIDES[slide];

  return (
    <section className="relative overflow-hidden bg-sand dark:bg-charcoal">
      <div className="absolute inset-0">
        <Image src={heroImageUrl} alt="" fill priority className="object-cover opacity-90 dark:opacity-40" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-cream/95 via-cream/75 to-transparent dark:from-[rgb(26_24_21/0.95)] dark:via-[rgb(26_24_21/0.7)]" />

      <div className="container-page relative flex min-h-[560px] items-center py-20 lg:min-h-[640px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-terracotta">
              {current.eyebrow}
            </p>
            <h1 className="text-display-xl font-bold leading-[1.05] tracking-tight">
              {current.title}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[rgb(var(--muted))]">
              {current.subtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={current.href}
                className="group inline-flex h-12 items-center gap-2 rounded-md bg-terracotta px-7 font-semibold text-white shadow-card transition hover:bg-terracotta-dark hover:shadow-lift"
              >
                {current.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/artisans"
                className="inline-flex h-12 items-center rounded-md border border-charcoal/25 px-7 font-semibold transition hover:border-terracotta hover:text-terracotta dark:border-cream/30"
              >
                Our story
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-8 left-4 flex gap-2 sm:left-6 lg:left-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all ${i === slide ? "w-10 bg-terracotta" : "w-5 bg-charcoal/30 dark:bg-cream/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
