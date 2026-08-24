"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const RECENT = [
  { name: "Emma", city: "Portland, OR", slug: "ember-glaze-stoneware-vase", title: "Ember Glaze Stoneware Vase", img: "/products/ember-glaze-stoneware-vase-1.svg", ago: "2 minutes ago" },
  { name: "Harry", city: "Manchester, UK", slug: "indigo-herringbone-throw", title: "Indigo Herringbone Throw", img: "/products/indigo-herringbone-throw-1.svg", ago: "6 minutes ago" },
  { name: "Lucía", city: "Austin, TX", slug: "terra-signet-ring-recycled-gold", title: "Terra Signet Ring · Recycled Gold", img: "/products/terra-signet-ring-recycled-gold-1.svg", ago: "11 minutes ago" },
  { name: "Grace", city: "Edinburgh, UK", slug: "windfall-oak-serving-board", title: "Windfall Oak Serving Board", img: "/products/windfall-oak-serving-board-1.svg", ago: "14 minutes ago" },
];

export function SocialProofToast() {
  const [idx, setIdx] = useState(-1);

  useEffect(() => {
    let i = 0;
    const show = () => setIdx(i++ % RECENT.length);
    const start = setTimeout(show, 12000);
    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (idx < 0) return;
    const next = setTimeout(() => setIdx((v) => v + 1), 9000);
    return () => clearTimeout(next);
  }, [idx]);

  const item = idx >= 0 ? RECENT[idx % RECENT.length] : null;

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[60] print-hidden">
      <AnimatePresence mode="wait">
        {item && (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-auto flex max-w-xs items-center gap-3 rounded-lg card-surface p-3 shadow-lift"
          >
            <Image src={item.img} alt="" width={44} height={44} className="rounded-md object-cover" />
            <div className="min-w-0 text-xs">
              <p className="truncate">
                <strong>{item.name}</strong> from {item.city} just bought{" "}
                <Link href={`/products/${item.slug}`} className="font-semibold text-terracotta hover:underline">
                  {item.title}
                </Link>
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[rgb(var(--muted))]">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                {item.ago} · verified order
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
