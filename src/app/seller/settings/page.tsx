"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Store, FileText, Landmark, Upload, Loader2, Save, KeyRound, Sheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";

interface SellerSettings {
  id: string;
  shopName: string;
  tagline: string | null;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  country: string;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  lowStockThreshold: number;
  payoutDetails: string | null;
}

const TABS = [
  { id: "shop", label: "Shop profile", icon: Store },
  { id: "policies", label: "Policies", icon: FileText },
  { id: "inventory", label: "Bulk inventory", icon: Sheet },
  { id: "payouts", label: "Payouts & security", icon: Landmark },
] as const;

export default function SellerSettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("shop");

  const { data, isLoading } = useQuery<{ seller: SellerSettings; email: string }>({
    queryKey: ["seller-settings"],
    queryFn: async () => (await fetch("/api/seller/settings")).json(),
  });

  if (isLoading || !data?.seller) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Studio settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Signed in as {data.email}</p>
      </div>

      <nav className="flex flex-wrap gap-1" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "true" : undefined}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-charcoal text-cream dark:bg-cream dark:text-charcoal"
                : "card-surface text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </nav>

      {tab === "shop" && <ShopProfile seller={data.seller} />}
      {tab === "policies" && <Policies seller={data.seller} />}
      {tab === "inventory" && <BulkInventory />}
      {tab === "payouts" && <PayoutsSecurity email={data.email} seller={data.seller} />}
    </div>
  );
}

/* ------------------------------------------------------------- shop profile */

function ShopProfile({ seller }: { seller: SellerSettings }) {
  const [form, setForm] = useState({
    shopName: seller.shopName,
    tagline: seller.tagline ?? "",
    bio: seller.bio ?? "",
    city: seller.city ?? "",
    country: seller.country,
    lowStockThreshold: seller.lowStockThreshold,
    logoUrl: seller.logoUrl ?? "",
    bannerUrl: seller.bannerUrl ?? "",
  });
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  async function upload(kind: "logo" | "banner", file: File) {
    setUploading(kind);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      setForm((f) => ({ ...f, [kind === "logo" ? "logoUrl" : "bannerUrl"]: json.url }));
    } catch (e: any) {
      toast.error(e.message);
    }
    setUploading(null);
  }

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seller/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tagline: form.tagline || null,
          bio: form.bio || null,
          city: form.city || null,
          lowStockThreshold: Number(form.lowStockThreshold),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
    },
    onSuccess: () => toast.success("Shop profile saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-5 rounded-lg card-surface p-6 shadow-subtle animate-fadeUp">
      {/* Banner */}
      <div>
        <Label>Banner image</Label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && upload("banner", e.dataTransfer.files[0]); }}
          className="relative mt-1 flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[rgb(var(--line))] bg-sand/50 transition hover:border-terracotta/60 dark:bg-charcoal-soft/30"
          onClick={() => bannerRef.current?.click()}
          role="button"
          aria-label="Upload banner"
        >
          {uploading === "banner" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[rgb(var(--muted))]" />
          ) : form.bannerUrl ? (
            <>
              <Image src={form.bannerUrl} alt="" fill sizes="700px" className="object-cover" />
              <span className="absolute bottom-2 right-2 rounded bg-charcoal/80 px-2 py-1 text-xs text-cream">Click to replace</span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm text-[rgb(var(--muted))]">
              <Upload className="h-5 w-5" /> Drop a wide image or click to browse
            </span>
          )}
          <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && upload("banner", e.target.files[0])} />
        </div>
      </div>

      {/* Logo + name */}
      <div className="flex items-start gap-4">
        <div
          onClick={() => logoRef.current?.click()}
          role="button"
          aria-label="Upload logo"
          className="relative -mt-10 h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[rgb(var(--line))] bg-sand shadow-lift dark:bg-charcoal-soft"
        >
          {uploading === "logo" ? (
            <Loader2 className="absolute inset-0 m-auto h-5 w-5 animate-spin text-[rgb(var(--muted))]" />
          ) : form.logoUrl ? (
            <Image src={form.logoUrl} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <Store className="absolute inset-0 m-auto h-7 w-7 text-[rgb(var(--muted))]" />
          )}
          <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && upload("logo", e.target.files[0])} />
        </div>
        <div className="flex-1 space-y-4 pt-1">
          <Field label="Shop name"><Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} maxLength={80} /></Field>
          <Field label="Tagline" hint={`${form.tagline.length}/140`}><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} maxLength={140} placeholder="Hand-built ceramics from Portland" /></Field>
        </div>
      </div>

      <Field label="About your studio">
        <Textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={4000} placeholder="Your craft, your process, your story…" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="City / region">
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} maxLength={80} placeholder="Asheville, NC" />
        </Field>
        <Field label="Country">
          <Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
          </Select>
        </Field>
      </div>

      <Field label="Default low-stock threshold" hint="Applied to new products; alerts appear on your dashboard.">
        <Input type="number" min={0} max={999} value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Math.max(0, parseInt(e.target.value || "0", 10)) })} className="w-32" />
      </Field>

      <SaveButton disabled={save.isPending} onClick={() => save.mutate()} />
    </section>
  );
}

/* ---------------------------------------------------------------- policies */

function Policies({ seller }: { seller: SellerSettings }) {
  const [shippingPolicy, setShippingPolicy] = useState(seller.shippingPolicy ?? "");
  const [returnPolicy, setReturnPolicy] = useState(seller.returnPolicy ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seller/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: seller.shopName,
          country: seller.country,
          shippingPolicy: shippingPolicy || null,
          returnPolicy: returnPolicy || null,
          lowStockThreshold: seller.lowStockThreshold,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
    },
    onSuccess: () => toast.success("Policies saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-5 rounded-lg card-surface p-6 shadow-subtle animate-fadeUp">
      <Field label="Shipping policy" hint="Shown on your shop page — processing time, packaging, carriers.">
        <Textarea rows={5} value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} maxLength={2000} placeholder="I ship within 2 business days via USPS Priority, carefully wrapped in recycled kraft…" />
      </Field>
      <Field label="Returns policy" hint="Buyers see this before checkout.">
        <Textarea rows={5} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} maxLength={2000} placeholder="Returns accepted within 14 days in original condition. Custom commissions are final sale." />
      </Field>
      <SaveButton disabled={save.isPending} onClick={() => save.mutate()} />
    </section>
  );
}

/* ----------------------------------------------------------- bulk inventory */

function BulkInventory() {
  const [csv, setCsv] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCsv(text: string): { sku: string; stock: number }[] {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sku, stock] = line.split(",").map((c) => c.trim());
        return { sku, stock: parseInt(stock, 10) };
      })
      .filter((r) => r.sku && Number.isFinite(r.stock));
  }

  const save = useMutation({
    mutationFn: async () => {
      const rows = parseCsv(csv);
      if (!rows.length) throw new Error("No valid rows found. Use: SKU,quantity");
      const res = await fetch("/api/seller/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Import failed");
      return json as { updatedCount: number };
    },
    onSuccess: (r) => {
      toast.success(`Updated ${r.updatedCount} product${r.updatedCount === 1 ? "" : "s"}`);
      setCsv("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rowCount = csv.trim() ? parseCsv(csv).length : 0;

  return (
    <section className="space-y-4 rounded-lg card-surface p-6 shadow-subtle animate-fadeUp">
      <div>
        <h2 className="text-sm font-semibold">CSV stock import</h2>
        <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
          One row per product: <code className="rounded bg-sand px-1 py-0.5 dark:bg-charcoal-soft">SKU,quantity</code>. Paste below or upload a .csv file — quantities become absolute stock levels.
        </p>
      </div>
      <Textarea
        rows={8}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        className="font-mono text-xs"
        placeholder={"POT-0042,12\nTXT-0107,3\nJWL-0031,0"}
        aria-label="CSV rows"
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          hidden
          ref={fileRef}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setCsv(await f.text());
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Sheet className="h-4 w-4" /> Choose file
        </Button>
        <Button size="sm" disabled={save.isPending || !rowCount} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Import {rowCount > 0 ? `${rowCount} row${rowCount === 1 ? "" : "s"}` : ""}
        </Button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- payouts/security */

function PayoutsSecurity({ email, seller }: { email: string; seller: SellerSettings }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const changePw = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirm) throw new Error("New passwords don't match.");
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Change failed");
    },
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fadeUp">
      <section className="rounded-lg card-surface p-6 shadow-subtle">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Landmark className="h-4 w-4 text-terracotta" /> Payout account</h2>
        <p className="mt-2 rounded-md bg-warning/10 p-3 text-xs leading-relaxed text-warning dark:text-warning">
          Direct deposits arrive with Stripe Connect integration (planned). Your details are stored securely until then.
        </p>
        <Textarea
          rows={2}
          defaultValue={seller.payoutDetails ?? ""}
          maxLength={500}
          placeholder="Bank name · Account holder · Last 4 digits only"
          onBlur={(e) => {
            fetch("/api/seller/settings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shopName: seller.shopName,
                country: seller.country,
                lowStockThreshold: seller.lowStockThreshold,
                payoutDetails: e.target.value,
              }),
            }).then((r) => { if (r.ok) toast.success("Payout note saved"); });
          }}
          className="mt-3"
        />
      </section>

      <section className="rounded-lg card-surface p-6 shadow-subtle">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-terracotta" /> Password</h2>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">Account: {email}</p>
        <form
          onSubmit={(e) => { e.preventDefault(); changePw.mutate(); }}
          className="mt-3 grid max-w-md gap-3"
        >
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" autoComplete="current-password" required />
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" minLength={8} autoComplete="new-password" required />
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" required />
          <Button type="submit" size="sm" disabled={changePw.isPending} className="justify-self-start">
            {changePw.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </Button>
        </form>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ shared */

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <div className="flex justify-end border-t border-[rgb(var(--line)/0.5)] pt-4">
      <Button onClick={onClick} disabled={disabled}>
        <Save className="h-4 w-4" /> Save changes
      </Button>
    </div>
  );
}
