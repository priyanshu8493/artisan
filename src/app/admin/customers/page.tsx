"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";

interface AdminCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  region: string;
  marketingOptIn: boolean;
  createdAt: string;
  orderCount: number;
  reviewCount: number;
}

export default function AdminCustomersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery<{ customers: AdminCustomer[] }>({
    queryKey: ["admin-customers", q],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      return (await fetch(`/api/admin/customers?${sp}`)).json();
    },
  });

  const toggleMarketing = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "marketing", value }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Action failed");
    },
    onSuccess: () => {
      toast.success("Marketing preference updated");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Delete failed");
    },
    onSuccess: () => {
      toast.success("Customer account removed");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const customers = data?.customers ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Customers</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{customers.length} customer accounts</p>
      </div>

      <div className="relative min-w-[200px] max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="pl-9" aria-label="Search customers" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-md" />)}</div>
      ) : customers.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No customers found" description="Try a different search." />
      ) : (
        <div className="overflow-x-auto rounded-lg card-surface shadow-subtle">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.6)] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Reviews</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Newsletter</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[rgb(var(--line)/0.4)] transition last:border-0 hover:bg-sand/50 dark:hover:bg-charcoal-soft/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{c.region}</td>
                  <td className="px-4 py-3 tabular-nums">{c.orderCount}</td>
                  <td className="px-4 py-3 tabular-nums">{c.reviewCount}</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">{new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={c.marketingOptIn}
                      onChange={(e) => toggleMarketing.mutate({ id: c.id, value: e.target.checked })}
                      aria-label={`Newsletter for ${c.name}`}
                      className="h-4 w-4 accent-terracotta"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-error hover:bg-error/10"
                        onClick={() => {
                          if (confirm(`Remove account for ${c.name}? This deletes their data.`)) remove.mutate(c.id);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
