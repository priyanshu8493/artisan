import { db } from "@/lib/db";
import { ProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add Product · Seller", robots: { index: false } };

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return <ProductForm mode="create" categories={categories} />;
}
