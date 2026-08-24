import { describe, it, expect } from "vitest";
import {
  addressSchema,
  checkoutSchema,
  productSchema,
  registerSchema,
  sellerResponseSchema,
} from "@/lib/validators";

const baseAddress = {
  fullName: "Priya Sharma",
  line1: "12 Craft Lane",
  city: "Asheville",
  postalCode: "28801",
  country: "US" as const,
};

describe("addressSchema", () => {
  it("accepts a valid US ZIP", () => {
    expect(addressSchema.safeParse({ ...baseAddress, state: "NC" }).success).toBe(true);
    expect(addressSchema.safeParse({ ...baseAddress, state: "NC", postalCode: "28801-1234" }).success).toBe(true);
  });

  it("rejects malformed US ZIPs", () => {
    expect(addressSchema.safeParse({ ...baseAddress, state: "NC", postalCode: "123" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...baseAddress, state: "NC", postalCode: "ABCDE" }).success).toBe(false);
  });

  it("accepts UK postcodes in common formats", () => {
    for (const pc of ["SW1A 1AA", "M1 1AE", "B33 8TH", "CR2 6XH", "DN55 1PT"]) {
      expect(
        addressSchema.safeParse({
          fullName: "Ada Smith",
          line1: "1 High St",
          city: "London",
          postalCode: pc,
          country: "GB",
        }).success
      ).toBe(true);
    }
  });
});

describe("registerSchema", () => {
  it("requires strong passwords", () => {
    expect(registerSchema.safeParse({ name: "A B", email: "a@b.co", password: "short", role: "CUSTOMER" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "A B", email: "a@b.co", password: "onlyletters1", role: "CUSTOMER" }).success).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(registerSchema.safeParse({ name: "A B", email: "nope", password: "onlyletters1", role: "CUSTOMER" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const valid = {
    title: "Hand-thrown Mug",
    description: "A lovely speckled stoneware mug glazed in cobalt.",
    priceCents: 2400,
    categoryId: "cat_1",
    stock: 5,
    images: [{ url: "/products/mug.svg" }],
  };

  it("accepts a minimal valid product", () => {
    const parsed = productSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("DRAFT");
      expect(parsed.data.lowStockThreshold).toBe(3);
      expect(parsed.data.variants).toEqual([]);
    }
  });

  it("enforces minimum price of $1", () => {
    expect(productSchema.safeParse({ ...valid, priceCents: 99 }).success).toBe(false);
  });

  it("requires at least one image", () => {
    expect(productSchema.safeParse({ ...valid, images: [] }).success).toBe(false);
  });

  it("rejects uppercase slugs", () => {
    expect(productSchema.safeParse({ ...valid, slug: "Not-A-Slug" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, slug: "ok-slug-1" }).success).toBe(true);
  });
});

describe("sellerResponseSchema", () => {
  it("bounds the response length", () => {
    expect(sellerResponseSchema.safeParse({ response: "Thank you!" }).success).toBe(true);
    expect(sellerResponseSchema.safeParse({ response: "" }).success).toBe(false);
    expect(sellerResponseSchema.safeParse({ response: "x".repeat(2001) }).success).toBe(false);
  });
});

describe("checkoutSchema shape", () => {
  it("exists and is an object schema", () => {
    const bad = checkoutSchema.safeParse(null);
    expect(bad.success).toBe(false);
  });
});
