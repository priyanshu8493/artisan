"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { Input, Label, FieldError } from "@/components/ui/input";

interface ProfileData {
  user: {
    email: string;
    name: string;
    phone: string | null;
    region: "US" | "GB";
    marketingOptIn: boolean;
    orderUpdatesOptIn: boolean;
  };
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/account/profile")).json(),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState<"US" | "GB">("US");
  const [marketing, setMarketing] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [loaded, setLoaded] = useState(false);

  if (data?.user && !loaded) {
    setName(data.user.name);
    setPhone(data.user.phone ?? "");
    setRegion(data.user.region);
    setMarketing(data.user.marketingOptIn);
    setOrderUpdates(data.user.orderUpdatesOptIn);
    setLoaded(true);
  }

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, region, marketingOptIn: marketing, orderUpdatesOptIn: orderUpdates }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      return d;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      document.cookie = `region=${region}; path=/; max-age=${60 * 60 * 24 * 180}`;
      qc.invalidateQueries({ queryKey: ["profile"] });
      window.location.reload();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <AccountShell title="Settings" subtitle="Profile details, preferences and security">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <section aria-labelledby="profile-heading" className="rounded-lg card-surface p-6 shadow-subtle">
          <h2 id="profile-heading" className="font-display text-xl font-bold">Personal information</h2>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="s-name" required>Full name</Label>
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={data?.user.email ?? ""} disabled className="opacity-60" />
              <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">Email can&apos;t be changed yet — contact support.</p>
            </div>
            <div>
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Preferences + security */}
        <div className="space-y-6">
          <section aria-labelledby="prefs-heading" className="rounded-lg card-surface p-6 shadow-subtle">
            <h2 id="prefs-heading" className="font-display text-xl font-bold">Preferences</h2>
            <div className="mt-4">
              <Label>Shopping region</Label>
              <div className="flex gap-2">
                {(["US", "GB"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(r)}
                    className={`flex-1 rounded-md border py-2.5 text-sm font-semibold transition ${
                      region === r ? "border-terracotta bg-terracotta/10 text-terracotta" : "card-surface hover:border-terracotta/40"
                    }`}
                  >
                    {r === "US" ? "🇺🇸 United States (USD)" : "🇬🇧 United Kingdom (GBP)"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-md bg-sand/60 px-4 py-3 text-sm dark:bg-charcoal-soft/40">
                Order status emails
                <input type="checkbox" checked={orderUpdates} onChange={(e) => setOrderUpdates(e.target.checked)} className="h-4 w-4 accent-terracotta" />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-md bg-sand/60 px-4 py-3 text-sm dark:bg-charcoal-soft/40">
                Newsletter &amp; new collections
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-4 w-4 accent-terracotta" />
              </label>
            </div>
            <button
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending || !name.trim()}
              className="mt-5 h-10 w-full rounded-md bg-charcoal font-semibold text-cream transition hover:bg-charcoal-soft disabled:opacity-50 dark:bg-cream dark:text-charcoal"
            >
              {saveProfile.isPending ? "Saving…" : "Save changes"}
            </button>
          </section>

          <PasswordCard />
        </div>
      </div>
    </AccountShell>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      setError("New password needs at least one letter and one number.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Change failed");
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Change failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} aria-labelledby="security-heading" className="rounded-lg card-surface p-6 shadow-subtle">
      <h2 id="security-heading" className="font-display text-xl font-bold">Security</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Change your password regularly to keep your account safe.</p>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="pw-current" required>Current password</Label>
          <Input id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
        <div>
          <Label htmlFor="pw-new" required>New password</Label>
          <Input id="pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <Label htmlFor="pw-confirm" required>Confirm new password</Label>
          <Input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          <FieldError message={error} />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="h-10 w-full rounded-md border border-error/70 font-semibold text-error transition hover:bg-error hover:text-white disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
