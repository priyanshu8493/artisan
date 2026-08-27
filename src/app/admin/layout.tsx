import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AdminSidebar name={user.name} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
