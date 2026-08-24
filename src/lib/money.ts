import {
  GBP_PER_USD,
  SHIPPING_METHODS,
  UK_VAT_RATE,
  US_STATE_TAX_RATES,
  type Currency,
  type Region,
} from "./constants";

export function regionCurrency(region: Region): Currency {
  return region === "GB" ? "GBP" : "USD";
}

/** Convert base USD cents to the region's display/charge currency */
export function convertFromUsd(centsUsd: number, region: Region): number {
  if (region === "US") return centsUsd;
  return Math.round(centsUsd * GBP_PER_USD);
}

export function formatMoney(cents: number, region: Region = "US"): string {
  const currency = regionCurrency(region);
  const converted = convertFromUsd(cents, region);
  const locale = region === "GB" ? "en-GB" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(converted / 100);
}

/** Sales tax for a destination. US: state combined rate; UK: 20% VAT */
export function taxRateFor(region: Region, stateOrCounty?: string | null): number {
  if (region === "GB") return UK_VAT_RATE;
  if (!stateOrCounty) return US_STATE_TAX_RATES.DEFAULT;
  return US_STATE_TAX_RATES[stateOrCounty.toUpperCase()] ?? US_STATE_TAX_RATES.DEFAULT;
}

export interface ShippingQuote {
  id: string;
  label: string;
  priceCents: number; // in region currency
  minDays: number;
  maxDays: number;
}

export function shippingQuotes(region: Region): ShippingQuote[] {
  return SHIPPING_METHODS[region].map((m) => ({
    id: m.id,
    label: m.label,
    priceCents: convertFromUsd(m.priceCentsUsd, region),
    minDays: m.minDays,
    maxDays: m.maxDays,
  }));
}

export function shippingMethodDef(region: Region, id: string) {
  return (
    SHIPPING_METHODS[region].find((m) => m.id === id) ?? SHIPPING_METHODS[region][0]
  );
}
