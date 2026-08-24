import Link from "next/link";
import { Instagram, Twitter, Facebook, ShieldCheck, Truck, Leaf } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[rgb(var(--line)/0.6)] bg-[rgb(var(--surface))] print-hidden dark:bg-charcoal">
      {/* Trust signals */}
      <div className="border-b border-[rgb(var(--line)/0.6)]">
        <div className="container-page grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure checkout", text: "256-bit encrypted payments" },
            { icon: Truck, title: "US & UK shipping", text: "Free over $75 / £60" },
            { icon: Leaf, title: "Plastic-free packing", text: "Recycled & compostable materials" },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand dark:bg-charcoal-soft text-terracotta">
                <t.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{t.title}</span>
                <span className="block text-xs text-[rgb(var(--muted))]">{t.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div>
          <p className="font-display text-2xl font-bold">Artisan<span className="text-terracotta">.</span></p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-[rgb(var(--muted))]">
            A curated marketplace connecting independent makers with people who
            believe beautiful things take time.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--line))] text-[rgb(var(--muted))] transition hover:border-terracotta hover:text-terracotta"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Shop links">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Shop</p>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/products", "All products"],
              ["/products?category=pottery-ceramics", "Pottery & Ceramics"],
              ["/products?category=textiles-weaving", "Textiles"],
              ["/products?category=jewelry", "Jewelry"],
              ["/artisans", "Meet the artisans"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-terracotta">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support links">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Support</p>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/account/orders", "Track your order"],
              ["/contact", "Contact us"],
              ["/seller", "Sell with us"],
              ["/privacy", "Privacy policy"],
              ["/terms", "Terms of service"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-terracotta">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            Join the letter
          </p>
          <p className="mb-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
            New collections, maker stories and early access — twice a month.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-[rgb(var(--line)/0.6)]">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-[rgb(var(--muted))] sm:flex-row">
          <p>© {new Date().getFullYear()} Artisan Market Ltd. All rights reserved.</p>
          <p>Prices in USD ($) or GBP (£) · UK VAT included where applicable</p>
        </div>
      </div>
    </footer>
  );
}
