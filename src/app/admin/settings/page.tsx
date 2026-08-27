"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, User, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/feedback";

interface AdminProfile {
  user: {
    email: string;
    name: string;
    role: string;
    phone: string | null;
    region: string;
    createdAt: string;
  };
}

export default function AdminSettingsPage() {
  const { data, isLoading } = useQuery<AdminProfile>({
    queryKey: ["admin-profile"],
    queryFn: async () => (await fetch("/api/account/profile")).json(),
  });

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const changePw = useMutation({
    mutationFn: async () => {
      if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next))
        throw new Error("New password needs at least one letter and one number.");
      if (next !== confirm) throw new Error("New passwords don't match.");
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Change failed");
    },
    onSuccess: () => {
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm(""); setError(null);
    },
    onError: (e: Error) => {
      setError(e.message);
      toast.error(e.message);
    },
  });

  if (isLoading || !data?.user) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  const u = data.user;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Administrator account — manage your sign-in details.</p>
      </div>

      {/* Profile summary */}
      <section className="rounded-lg card-surface p-6 shadow-subtle">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><User className="h-5 w-5 text-terracotta" /> Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.4)] pb-3">
            <dt className="text-[rgb(var(--muted))]">Name</dt>
            <dd className="font-medium">{u.name}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.4)] pb-3">
            <dt className="text-[rgb(var(--muted))]">Email</dt>
            <dd className="font-medium">{u.email}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.4)] pb-3">
            <dt className="text-[rgb(var(--muted))]">Role</dt>
            <dd className="flex items-center gap-1.5 font-semibold text-terracotta"><ShieldCheck className="h-4 w-4" /> ADMIN</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[rgb(var(--muted))]">Member since</dt>
            <dd className="font-medium">{new Date(u.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</dd>
          </div>
        </dl>
      </section>

      {/* Password change */}
      <form
        onSubmit={(e) => { e.preventDefault(); changePw.mutate(); }}
        aria-labelledby="security-heading"
        className="rounded-lg card-surface p-6 shadow-subtle"
      >
        <h2 id="security-heading" className="flex items-center gap-2 font-display text-xl font-bold"><KeyRound className="h-5 w-5 text-terracotta" /> Change password</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Update your password from the default <code className="rounded bg-sand px-1 py-0.5 dark:bg-charcoal-soft">Admin@1234</code>.
        </p>
        <div className="mt-4 max-w-md space-y-3">
          <div>
            <Label htmlFor="pw-current" required>Current password</Label>
            <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </div>
          <div>
            <Label htmlFor="pw-new" required>New password</Label>
            <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required placeholder="At least 8 chars, letter + number" />
          </div>
          <div>
            <Label htmlFor="pw-confirm" required>Confirm new password</Label>
            <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          {error && <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-xs font-medium text-error">{error}</p>}
          <Button type="submit" size="sm" disabled={changePw.isPending}>
            {changePw.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
