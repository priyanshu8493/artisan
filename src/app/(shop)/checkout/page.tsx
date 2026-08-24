"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check, Loader2, Lock, MapPin, CreditCard } from "lucide-react";
import { Input, Select, Label, FieldError, Textarea } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const UK_COUNTIES = ["Greater London", "West Midlands", "Greater Manchester", "West Yorkshire", "Kent", "Essex", "Merseyside", "South Yorkshire", "Hampshire", "Lancashire", "Cornwall", "Devon", "Cumbria", "Norfolk", "Suffolk", "Wales", "Scotland", "Northern Ireland"];

type CheckoutForm = {
  email: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: "US" | "GB";
  phone?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useSession();
  const { items, clear } = useCart();
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [coupon] = useState<string | null>(null);

  const region = user?.region ?? "US";
  const fmt = (centsUsd: number) =>
    new Intl.NumberFormat(region === "GB" ? "en-GB" : "en-US", {
      style: "currency",
      currency: region === "GB" ? "GBP" : "USD",
    }).format((region === "GB" ? Math.round(centsUsd * 0.79) : centsUsd) / 100);

  const subtotal = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const shippingUsd = subtotal >= 7500 || subtotal === 0 ? 0 : shippingMethod === "express" ? 1499 : 599;
  const taxRate = region === "GB" ? 0.2 : 0.07;
  const taxable = Math.max(0, subtotal - (coupon ? 1000 : 0));
  const tax = Math.round(taxable * taxRate);
  const total = taxable + shippingUsd + tax;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
  } = useForm<CheckoutForm>({
    defaultValues: {
      email: "",
      fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "",
      country: "US",
    },
  });

  // Prefill for logged-in users
  useEffect(() => {
    if (!user) return;
    setValue("email", user.email);
    fetch("/api/account/addresses")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const addr = d?.addresses?.find((a: any) => a.isDefault) ?? d?.addresses?.[0];
        if (addr) {
          setValue("fullName", addr.fullName);
          setValue("line1", addr.line1);
          setValue("line2", addr.line2 ?? "");
          setValue("city", addr.city);
          setValue("state", addr.state ?? "");
          setValue("postalCode", addr.postalCode);
          setValue("country", addr.country);
          setValue("phone", addr.phone ?? "");
        }
      })
      .catch(() => {});
  }, [user, setValue]);

  const country = watch("country");
  const isUS = country === "US";

  useEffect(() => {
    setValue("country", region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  async function geolocate() {
    if (!navigator.geolocation) return toast.error("Geolocation not available");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        const a = data.address ?? {};
        const detectedCountry = (data.address?.country_code ?? "").toUpperCase();
        if (detectedCountry === "GB" || detectedCountry === "US")
          setValue("country", detectedCountry);
        setValue("line1", [a.house_number, a.road].filter(Boolean).join(" ") || getValues("line1"));
        setValue("city", a.city || a.town || a.village || getValues("city"));
        setValue("postalCode", a.postcode || getValues("postalCode"));
        toast.success("Address filled from your location — please review it.");
      } catch {
        toast.error("Could not detect your address");
      }
    }, () => toast.error("Location permission denied"));
  }

  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  function validateAndNext() {
    const v = getValues();
    const errs: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) errs.email = "Enter a valid email";
    if (!v.fullName || v.fullName.length < 2) errs.fullName = "Full name is required";
    if (!v.line1 || v.line1.length < 3) errs.line1 = "Street address is required";
    if (!v.city || v.city.length < 2) errs.city = "City is required";
    const postalOk = isUS ? /^\d{5}(-\d{4})?$/.test(v.postalCode) : /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(v.postalCode);
    if (!postalOk) errs.postalCode = isUS ? "Enter a valid ZIP (e.g. 90210)" : "Enter a valid UK postcode";
    setManualErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(2);
      window.scrollTo({ top: 0 });
    }
  }

  async function placeOrder(data: CheckoutForm) {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          shippingAddress: {
            label: "Home",
            fullName: data.fullName,
            line1: data.line1,
            line2: data.line2 || null,
            city: data.city,
            state: data.state || null,
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone || null,
            isDefault: false,
          },
          shippingMethod,
          couponCode: coupon,
          customerNote: null,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? undefined,
            quantity: i.quantity,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Order failed");
      clear();
      router.push(`/orders/${result.orderNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setPlacing(false);
    }
  }

  if (items.length === 0 && !placing) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-display-lg font-bold">Your cart is empty</h1>
        <p className="mt-3 text-[rgb(var(--muted))]">Add some handmade goodness before checking out.</p>
        <Link href="/products" className="mt-6 inline-flex h-11 items-center rounded-md bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-dark">
          Browse products
        </Link>
      </div>
    );
  }

  const steps = ["Details", "Shipping", "Review"];
  const summary = useMemoSummary(items, fmt);

  return (
    <div className="container-page py-10">
      <h1 className="text-display-lg font-bold">Checkout</h1>

      {/* Progress indicator */}
      <ol className="mt-6 flex items-center gap-2 text-sm" aria-label="Checkout progress">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                step > i + 1
                  ? "border-success bg-success text-white"
                  : step === i + 1
                    ? "border-terracotta bg-terracotta text-white"
                    : "border-[rgb(var(--line))] text-[rgb(var(--muted))]"
              )}
              aria-current={step === i + 1 ? "step" : undefined}
            >
              {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden font-medium sm:block", step === i + 1 ? "" : "text-[rgb(var(--muted))]")}>{label}</span>
            {i < steps.length - 1 && <span className={cn("h-px flex-1 transition-colors", step > i + 1 ? "bg-success" : "bg-[rgb(var(--line))]")} />}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(placeOrder)} className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <input type="hidden" {...register("email")} />
        {/* Left column */}
        <div className="space-y-8">
          {step === 1 && (
            <section aria-labelledby="details-heading" className="animate-fadeUp rounded-lg card-surface p-6 shadow-subtle">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="details-heading" className="flex items-center gap-2 font-display text-xl font-bold">
                  <MapPin className="h-5 w-5 text-terracotta" /> Contact & delivery details
                </h2>
                {!user && (
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Guest checkout ·{" "}
                    <Link href="/login?next=/checkout" className="font-semibold text-terracotta hover:underline">
                      Sign in
                    </Link>
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="field-email" required>Email</Label>
                  <Input id="field-email" type="email" error={!!manualErrors.email}
                    {...register("email")} />
                  <FieldError message={manualErrors.email} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="field-fullName" required>Full name</Label>
                  <Input id="field-fullName" error={!!manualErrors.fullName}
                    autoComplete="name" {...register("fullName")} />
                  <FieldError message={manualErrors.fullName} />
                </div>
                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <Label htmlFor="field-line1" required>Street address</Label>
                    <button type="button" onClick={geolocate} className="text-xs font-semibold text-terracotta hover:underline">
                      ⌖ Use my location
                    </button>
                  </div>
                  <Input id="field-line1" error={!!manualErrors.line1} autoComplete="address-line1"
                    placeholder="123 Main Street" {...register("line1")} />
                  <FieldError message={manualErrors.line1} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="field-line2">Apartment, suite, etc.</Label>
                  <Input id="field-line2" autoComplete="address-line2" {...register("line2")} />
                </div>
                <div>
                  <Label htmlFor="field-city" required>City</Label>
                  <Input id="field-city" error={!!manualErrors.city} autoComplete="address-level2"
                    {...register("city")} />
                  <FieldError message={manualErrors.city} />
                </div>
                <div>
                  <Label>{isUS ? "State" : "County"}</Label>
                  <Select {...register("state")}>
                    <option value="">Select…</option>
                    {(isUS ? US_STATES : UK_COUNTIES).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field-postalCode" required>{isUS ? "ZIP code" : "Postcode"}</Label>
                  <Input id="field-postalCode" error={!!manualErrors.postalCode}
                    autoComplete="postal-code" {...register("postalCode")} />
                  <FieldError message={manualErrors.postalCode} />
                </div>
                <div>
                  <Label>Country / Region</Label>
                  <Select
                    {...register("country")}
                    onChange={(e) => {
                      setValue("country", e.target.value as "US" | "GB");
                      setValue("state", "");
                    }}
                  >
                    <option value="US">United States 🇺🇸</option>
                    <option value="GB">United Kingdom 🇬🇧</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="field-phone">Phone (for delivery updates)</Label>
                  <Input id="field-phone" type="tel" autoComplete="tel" {...register("phone")} />
                </div>
              </div>

              <button
                type="button"
                onClick={validateAndNext}
                className="mt-6 h-12 w-full rounded-md bg-charcoal font-semibold text-cream transition hover:bg-charcoal-soft dark:bg-cream dark:text-charcoal"
              >
                Continue to shipping
              </button>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="shipping-heading" className="animate-fadeUp space-y-6">
              <div className="rounded-lg card-surface p-6 shadow-subtle">
                <h2 id="shipping-heading" className="font-display text-xl font-bold">Shipping method</h2>
                <div className="mt-4 space-y-3">
                  {[
                    { id: "standard" as const, label: region === "GB" ? "Standard (Royal Mail)" : "Standard", days: region === "GB" ? "3–5 business days" : "4–7 business days", price: subtotal >= 7500 ? 0 : 599 },
                    { id: "express" as const, label: region === "GB" ? "Express (DPD)" : "Express", days: region === "GB" ? "1–2 business days" : "2–3 business days", price: 1499 },
                  ].map((m) => (
                    <label
                      key={m.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md border p-4 transition",
                        shippingMethod === m.id ? "border-terracotta bg-terracotta/5" : "card-surface hover:border-terracotta/40"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === m.id}
                          onChange={() => setShippingMethod(m.id)}
                          className="h-4 w-4 accent-terracotta"
                        />
                        <span>
                          <span className="block text-sm font-semibold">{m.label}</span>
                          <span className="block text-xs text-[rgb(var(--muted))]">{m.days}</span>
                        </span>
                      </span>
                      <span className="text-sm font-semibold">{m.price === 0 ? <span className="text-success">Free</span> : fmt(m.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="h-12 rounded-md card-surface px-6 font-medium shadow-subtle">
                  Back
                </button>
                <button type="button" onClick={() => { setStep(3); window.scrollTo({ top: 0 }); }} className="h-12 flex-1 rounded-md bg-charcoal font-semibold text-cream dark:bg-cream dark:text-charcoal">
                  Review order
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="review-heading" className="animate-fadeUp space-y-6">
              {/* Payment placeholder */}
              <div className="rounded-lg border-2 border-dashed border-success/40 bg-success/5 p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                  <CreditCard className="h-5 w-5 text-success" /> Payment
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  Payments are coming soon. Your order will be placed in <strong>demo mode</strong> —
                  no card needed, nothing charged. The full Stripe integration slots in here.
                </p>
              </div>

              <div className="rounded-lg card-surface p-6 shadow-subtle">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-bold">Delivering to</h3>
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-terracotta hover:underline">
                    Edit
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {watch("fullName")}<br />
                  {watch("line1")}{watch("line2") ? `, ${watch("line2")}` : ""}<br />
                  {watch("city")}, {watch("state")} {watch("postalCode")}<br />
                  {isUS ? "United States" : "United Kingdom"}
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="h-12 rounded-md card-surface px-6 font-medium shadow-subtle">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={placing}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-terracotta font-semibold text-white shadow-card transition hover:bg-terracotta-dark active:scale-[.98] disabled:opacity-60"
                >
                  {placing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Placing your order…</>
                  ) : (
                    <><Lock className="h-4 w-4" /> Place order · {fmt(total)}</>
                  )}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Summary rail */}
        <aside className="h-fit rounded-lg card-surface p-6 shadow-card lg:sticky lg:top-32" aria-label="Order summary">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3 border-b border-[rgb(var(--line)/0.7)] pb-4">
            {summary.lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 text-sm">
                <Image src={l.img} alt="" width={44} height={44} className="rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate">{l.title}</span>
                <span className="text-[rgb(var(--muted))]">×{l.qty}</span>
                <span className="font-medium tabular-nums">{l.total}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shippingUsd === 0 ? <span className="text-success">Free</span> : fmt(shippingUsd)}</dd></div>
            <div className="flex justify-between"><dt>Tax{region === "GB" ? " (VAT 20%)" : ""}</dt><dd>{fmt(tax)}</dd></div>
            <div className="flex justify-between border-t border-[rgb(var(--line)/0.7)] pt-3 text-base font-bold"><dt>Total</dt><dd>{fmt(total)}</dd></div>
          </dl>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[rgb(var(--muted))]">
            <Lock className="h-3 w-3" /> Secure SSL checkout · 30-day returns
          </p>
        </aside>
      </form>
    </div>
  );
}

function useMemoSummary(
  items: ReturnType<typeof useCart.getState>["items"],
  fmt: (c: number) => string
) {
  return useMemo(
    () => ({
      lines: items.map((i) => ({
        key: i.productId + (i.variantId ?? ""),
        img: i.imageUrl,
        title: i.title,
        qty: i.quantity,
        total: fmt(i.priceCents * i.quantity),
      })),
    }),
    [items, fmt]
  );
}
