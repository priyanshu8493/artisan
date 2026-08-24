import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { AccountShell } from "@/components/account/account-shell";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/account");

  const [user, orderCount, reviewCount] = await Promise.all([
    db.user.findUnique({ where: { id: sessionUser.id }, include: { sellerProfile: true } }),
    db.order.count({ where: { userId: sessionUser.id } }),
    db.review.count({ where: { userId: sessionUser.id } }),
  ]);
  if (!user) redirect("/login");

  return (
    <AccountShell title={`Welcome back, ${user.name.split(" ")[0]}`} subtitle="Your account at a glance">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders placed", value: orderCount, href: "/account/orders" },
          { label: "Reviews written", value: reviewCount, href: "/account/reviews" },
          {
            label: "Member since",
            value: user.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            href: undefined,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg card-surface p-6 shadow-subtle">
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{stat.value}</p>
            {stat.href && (
              <a href={stat.href} className="mt-1 inline-block text-xs font-medium text-terracotta hover:underline">
                View →
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-label="Notification preferences" className="rounded-lg card-surface p-6 shadow-subtle">
          <h2 className="font-display text-xl font-bold">Email preferences</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">Choose what we land in your inbox.</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-md bg-sand/60 px-4 py-3 dark:bg-charcoal-soft/40">
              <span>Order updates (shipped, delivered)</span>
              <Badge on={user.orderUpdatesOptIn} />
            </li>
            <li className="flex items-center justify-between rounded-md bg-sand/60 px-4 py-3 dark:bg-charcoal-soft/40">
              <span>New collections &amp; maker stories</span>
              <Badge on={user.marketingOptIn} />
            </li>
          </ul>
          <a href="/account/settings" className="mt-5 inline-flex h-10 items-center rounded-md border border-charcoal px-4 text-sm font-medium transition hover:border-terracotta hover:text-terracotta dark:border-cream/40">
            Manage preferences
          </a>
        </section>

        <section aria-label="Quick actions" className="rounded-lg card-surface p-6 shadow-subtle">
          <h2 className="font-display text-xl font-bold">Quick links</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["/wishlist", "♥ Your wishlist", "Saved pieces across every artisan"],
              ["/account/orders", "Track a package", "Live status for every order"],
              ...(user.role === "SELLER"
                ? [["/seller", "Seller dashboard", "Manage your shop"]]
                : []),
            ].map(([href, title, desc]) => (
              <a key={href} href={href} className="group flex items-center justify-between rounded-md border border-[rgb(var(--line)/0.7)] p-4 transition hover:border-terracotta/50 hover:shadow-subtle">
                <span>
                  <span className="block text-sm font-semibold group-hover:text-terracotta">{title}</span>
                  <span className="block text-xs text-[rgb(var(--muted))]">{desc}</span>
                </span>
                <span aria-hidden className="text-[rgb(var(--muted))]">→</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </AccountShell>
  );
}

function Badge({ on }: { on: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${on ? "bg-success/15 text-success" : "bg-[rgb(var(--line)/0.6)] text-[rgb(var(--muted))]"}`}
    >
      {on ? "ON" : "OFF"}
    </span>
  );
}
