import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/products",
    "/artisans",
    "/contact",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const [products, artisans, categories] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.sellerProfile.findMany({
      select: { slug: true },
    }),
    db.category.findMany({ select: { slug: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: `${SITE}/products?category=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...artisans.map((a) => ({
      url: `${SITE}/artisans/${a.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
