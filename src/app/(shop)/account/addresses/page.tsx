"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, MapPin, Star } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Label, FieldError } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

const US_STATES = ["NY","CA","TX","FL","WA","IL","PA","OH","GA","NC","MA","CO","AZ","OR","MI","NJ","VA","TN","IN","MO","MD","WI","MN","SC","AL","LA","KY","OK","CT","UT","NV","AR","MS","KS","NM","NE","WV","ID","HI","NH","ME","MT","RI","DE","SD","ND","AK","VT","WY"];
const UK_COUNTIES = ["Greater London", "Greater Manchester", "West Midlands", "West Yorkshire", "Kent", "Essex", "Merseyside", "Hampshire", "Cornwall", "Devon", "Wales", "Scotland", "Northern Ireland"];

export default function AddressesPage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery<{ addresses: Address[] }>({
    queryKey: ["addresses"],
    queryFn: async () => (await fetch("/api/account/addresses")).json(),
  });

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Address removed");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
    onError: () => toast.error("Could not remove address"),
  });

  return (
    <AccountShell title="Saved addresses" subtitle="Used to pre-fill your checkout">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setAdding(true)}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-terracotta px-5 text-sm font-semibold text-white shadow-subtle transition hover:bg-terracotta-dark"
        >
          <Plus className="h-4 w-4" /> Add address
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="skeleton h-44 rounded-lg" />)}</div>
      ) : !data?.addresses?.length ? (
        <EmptyState
          icon={<MapPin className="h-6 w-6" />}
          title="No saved addresses"
          description="Add one to make checkout lightning fast."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.addresses.map((addr) => (
            <li key={addr.id} className={cn("relative rounded-lg card-surface p-5 shadow-subtle", addr.isDefault && "border-terracotta/50")}>
              <div className="flex items-start justify-between">
                <p className="flex items-center gap-1.5 text-sm font-bold capitalize">
                  <MapPin className="h-4 w-4 text-terracotta" /> {addr.label}
                  {addr.isDefault && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">
                      <Star className="h-2.5 w-2.5 fill-current" /> Default
                    </span>
                  )}
                </p>
                <button
                  onClick={() => remove.mutate(addr.id)}
                  aria-label={`Delete ${addr.label} address`}
                  className="rounded-full p-1.5 text-[rgb(var(--muted))] transition hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <address className="mt-3 text-sm not-italic leading-relaxed text-[rgb(var(--muted))]">
                {addr.fullName}<br />
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                {addr.city}, {addr.state} {addr.postalCode}<br />
                {addr.country === "GB" ? "United Kingdom 🇬🇧" : "United States 🇺🇸"}
                {addr.phone && <><br />{addr.phone}</>}
              </address>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <AddAddressModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            qc.invalidateQueries({ queryKey: ["addresses"] });
          }}
        />
      )}
    </AccountShell>
  );
}

function AddAddressModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    label: "Home", fullName: "", line1: "", line2: "", city: "",
    state: "", postalCode: "", country: "US", phone: "", isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isUS = form.country === "US";

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Required";
    if (!form.line1.trim()) errs.line1 = "Required";
    if (!form.city.trim()) errs.city = "Required";
    const okPostal = isUS ? /^\d{5}(-\d{4})?$/.test(form.postalCode) : /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(form.postalCode);
    if (!okPostal) errs.postalCode = isUS ? "Enter a valid ZIP code" : "Enter a valid UK postcode";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, state: form.state || null, phone: form.phone || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      toast.success("Address saved");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy="addr-modal-title">
      <form onSubmit={submit} className="max-h-[85vh] overflow-y-auto p-6">
        <h3 id="addr-modal-title" className="font-display text-xl font-bold">New address</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="a-label">Label</Label>
            <Input id="a-label" value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="Home / Work" />
          </div>
          <div>
            <Label htmlFor="a-country">Country</Label>
            <Select
              id="a-country"
              value={form.country}
              onChange={(e) => { set("country", e.target.value); set("state", ""); }}
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="a-name" required>Full name</Label>
            <Input id="a-name" error={!!errors.fullName} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
            <FieldError message={errors.fullName} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="a-line1" required>Street address</Label>
            <Input id="a-line1" error={!!errors.line1} value={form.line1} onChange={(e) => set("line1", e.target.value)} autoComplete="address-line1" />
            <FieldError message={errors.line1} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="a-line2">Apt, suite (optional)</Label>
            <Input id="a-line2" value={form.line2} onChange={(e) => set("line2", e.target.value)} autoComplete="address-line2" />
          </div>
          <div>
            <Label htmlFor="a-city" required>City</Label>
            <Input id="a-city" error={!!errors.city} value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
            <FieldError message={errors.city} />
          </div>
          <div>
            <Label>{isUS ? "State" : "County"}</Label>
            <Select value={form.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Select…</option>
              {(isUS ? US_STATES : UK_COUNTIES).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="a-zip" required>{isUS ? "ZIP code" : "Postcode"}</Label>
            <Input id="a-zip" error={!!errors.postalCode} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value.toUpperCase())} autoComplete="postal-code" />
            <FieldError message={errors.postalCode} />
          </div>
          <div>
            <Label htmlFor="a-phone">Phone</Label>
            <Input id="a-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
          </div>
          <label className="col-span-2 flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="h-4 w-4 accent-terracotta"
            />
            Set as default shipping address
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2.5 text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]">Cancel</button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-terracotta px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-terracotta-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save address"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
