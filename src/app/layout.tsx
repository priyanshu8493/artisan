import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Artisan Market — Handmade Crafts from Independent Makers",
    template: "%s | Artisan Market",
  },
  description:
    "A curated marketplace for premium handmade handicrafts — pottery, textiles, jewelry and woodwork from independent artisans across the US and UK.",
  openGraph: {
    type: "website",
    siteName: "Artisan Market",
    title: "Artisan Market — Handmade Crafts from Independent Makers",
    description:
      "Premium handmade pottery, textiles, jewelry and woodwork from independent artisans in the US & UK.",
  },
  twitter: { card: "summary_large_image" },
};

const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
