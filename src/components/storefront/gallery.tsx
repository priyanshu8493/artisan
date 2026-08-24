"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({
  images,
  title,
  videoUrl,
}: {
  images: { url: string; alt?: string | null }[];
  title: string;
  videoUrl?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!zoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnails */}
      <div className="no-scrollbar flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
        {images.map((img, i) => (
          <button
            key={img.url}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={active === i}
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-20 sm:w-20",
              active === i ? "border-terracotta" : "border-transparent opacity-70 hover:opacity-100"
            )}
          >
            <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[rgb(var(--line))] text-xs font-semibold text-[rgb(var(--muted))] transition hover:border-terracotta hover:text-terracotta sm:h-20 sm:w-20"
          >
            ▶ Video
          </a>
        )}
      </div>

      {/* Main image */}
      <div
        className={cn(
          "relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-lg bg-sand dark:bg-charcoal-soft",
          zoom && "cursor-zoom-out"
        )}
        onClick={() => setZoom((z) => !z)}
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(false)}
      >
        <Image
          src={images[active]?.url ?? images[0]?.url ?? ""}
          alt={images[active]?.alt || title}
          fill
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          style={{ transformOrigin: origin }}
          className={cn(
            "object-cover transition-transform duration-300",
            zoom && "scale-[2]"
          )}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-charcoal/60 px-3 py-1 text-[11px] text-cream backdrop-blur print-hidden">
          {zoom ? "Click to zoom out" : "Hover · click to zoom"}
        </span>
      </div>
    </div>
  );
}
