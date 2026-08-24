import { describe, it, expect } from "vitest";
import {
  regionCurrency,
  convertFromUsd,
  formatMoney,
  taxRateFor,
  shippingQuotes,
  shippingMethodDef,
} from "@/lib/money";
import { GBP_PER_USD } from "@/lib/constants";

describe("regionCurrency", () => {
  it("maps GB to GBP and US to USD", () => {
    expect(regionCurrency("GB")).toBe("GBP");
    expect(regionCurrency("US")).toBe("USD");
  });
});

describe("convertFromUsd", () => {
  it("leaves US amounts untouched", () => {
    expect(convertFromUsd(4999, "US")).toBe(4999);
  });

  it("converts GBP at the fixed rate, rounded", () => {
    expect(convertFromUsd(10000, "GB")).toBe(Math.round(10000 * GBP_PER_USD));
    expect(convertFromUsd(1, "GB")).toBe(Math.round(0.79));
  });
});

describe("formatMoney", () => {
  it("formats USD with dollar sign", () => {
    expect(formatMoney(16400, "US")).toMatch(/\$16[.,]40/);
  });

  it("formats GBP with pound sign at converted value", () => {
    const gbp = Math.round(16400 * GBP_PER_USD) / 100;
    expect(formatMoney(16400, "GB")).toMatch(new RegExp(`£${gbp.toFixed(2).replace(".", "[.,]")}`));
  });
});

describe("taxRateFor", () => {
  it("returns UK VAT for GB regardless of state", () => {
    expect(taxRateFor("GB", "London")).toBeCloseTo(0.2);
  });

  it("uses known state rates in the US", () => {
    expect(taxRateFor("US", "ca")).toBeCloseTo(0.0875);
    expect(taxRateFor("US", "NY")).toBeCloseTo(0.08875);
  });

  it("falls back to the default rate for unknown/missing states", () => {
    expect(taxRateFor("US")).toBeCloseTo(0.07);
    expect(taxRateFor("US", "ZZ")).toBeCloseTo(0.07);
  });
});

describe("shippingQuotes", () => {
  it("returns quotes per region with converted prices", () => {
    const us = shippingQuotes("US");
    const gb = shippingQuotes("GB");
    expect(us.length).toBeGreaterThan(0);
    expect(gb.length).toBeGreaterThan(0);
    expect(us.every((q) => typeof q.priceCents === "number" && q.minDays <= q.maxDays)).toBe(true);

    const gbStandard = gb.find((q) => q.id === "standard")!;
    const usStandard = SHIPPING_US_STANDARD;
    expect(gbStandard.priceCents).toBe(Math.round(usStandard * GBP_PER_USD));
  });
});

describe("shippingMethodDef", () => {
  it("finds a method by id", () => {
    expect(shippingMethodDef("US", "express").id).toBe("express");
  });

  it("falls back to the first method for unknown ids", () => {
    expect(shippingMethodDef("US", "carrier-pigeon").id).toBe(
      shippingQuotes("US")[0].id
    );
  });
});

import { SHIPPING_METHODS } from "@/lib/constants";
const SHIPPING_US_STANDARD = SHIPPING_METHODS.US.find((m) => m.id === "standard")!.priceCentsUsd;
