import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ProductForm, type ProductFormValues } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Product · Seller", robots: { index: false } };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const [seller, categories] = await Promise.all([
    db.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!seller) notFound();

  const product = await db.product.findFirst({
    where: { id, sellerId: seller.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
  });
  if (!product) notFound();

  // Strip HTML for the editors (TipTap re-parses HTML fine, so pass through)
  const initial: Partial<ProductFormValues> = {
    title: product.title,
    slug: product.slug,
    descriptionHtml: product.description,
    storyHtml: product.story ?? "",
    categoryId: product.categoryId,
    sku: product.sku ?? "",
    priceDollars: (product.priceCents / 100).toFixed(2),
    compareAtDollars: product.compareAtCents ? (product.compareAtCents / 100).toFixed(2) : "",
    materials: product.materials ?? "",
    color: product.color ?? "",
    dimensions: product.dimensions ?? "",
    weightGrams: product.weightGrams != null ? String(product.weightGrams) : "",
    careInstructions: product.careInstructions ?? "",
    originCountry: (product.originCountry as "US" | "GB") ?? "",
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    featured: product.featured,
    videoUrl: product.videoUrl ?? "",
    metaTitle: product.metaTitle ?? "",
    metaDescription: product.metaDescription ?? "",
    keywords: product.keywords ?? "",
    images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    variants: product.variants.map((v) => ({
      name: v.name,
      optionSize: v.optionSize ?? "",
      optionColor: v.optionColor ?? "",
      optionMaterial: v.optionMaterial ?? "",
      priceDeltaCents: v.priceDeltaCents,
      stock: v.stock,
      sku: v.sku ?? "",
    })),
  };

  return <ProductForm mode="edit" productId={product.id} initial={initial} categories={categories} />;
}
