import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SellerSidebar } from "@/components/seller/sidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Seller Dashboard",
  robots: { index: false },
};

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/seller");
  if (!["SELLER", "ADMIN"].includes(user.role)) redirect("/");

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <SellerSidebar shopName={user.name} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
