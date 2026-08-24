export type Region = "US" | "GB";
export type Currency = "USD" | "GBP";

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ROLES = ["CUSTOMER", "SELLER", "ADMIN"] as const;

export const ORDER_STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "error" }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  PROCESSING: { label: "Processing", tone: "info" },
  SHIPPED: { label: "Shipped", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "error" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export const PRODUCT_STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "warning" },
};

/** US state sales tax rates — representative combined rates, override per deployment */
export const US_STATE_TAX_RATES: Record<string, number> = {
  CA: 0.0875, TX: 0.0825, NY: 0.08875, FL: 0.07, WA: 0.1025,
  IL: 0.1025, PA: 0.06, OH: 0.0725, GA: 0.075, NC: 0.0475,
  MA: 0.0625, CO: 0.0781, AZ: 0.086, TN: 0.0955, DEFAULT: 0.07,
};

export const UK_VAT_RATE = 0.2;

/** GBP per USD — single source for display conversion; move to FX service later */
export const GBP_PER_USD = 0.79;

export interface ShippingMethodDef {
  id: string;
  label: string;
  priceCentsUsd: number;
  minDays: number;
  maxDays: number;
}

export const SHIPPING_METHODS: Record<Region, ShippingMethodDef[]> = {
  US: [
    { id: "standard", label: "Standard", priceCentsUsd: 599, minDays: 4, maxDays: 7 },
    { id: "express", label: "Express", priceCentsUsd: 1499, minDays: 2, maxDays: 3 },
  ],
  GB: [
    { id: "standard", label: "Standard (Royal Mail)", priceCentsUsd: 499, minDays: 3, maxDays: 5 },
    { id: "express", label: "Express (DPD)", priceCentsUsd: 1199, minDays: 1, maxDays: 2 },
  ],
};

export const FREE_SHIPPING_THRESHOLD_CENTS_USD = 7500;

export const CATEGORIES = [
  {
    name: "Pottery & Ceramics",
    slug: "pottery-ceramics",
    description: "Hand-thrown stoneware, porcelain and earthenware from studio potters.",
    palette: ["#C4623A", "#E08A63", "#F1E8DC"],
  },
  {
    name: "Textiles & Weaving",
    slug: "textiles-weaving",
    description: "Handwoven throws, naturally dyed linens and fibre art.",
    palette: ["#2E3A59", "#5B6B94", "#E7DACA"],
  },
  {
    name: "Jewelry",
    slug: "jewelry",
    description: "Forged metalwork, gemstone settings and precious beadwork.",
    palette: ["#B98A38", "#D9B36A", "#FAF6F0"],
  },
  {
    name: "Woodwork",
    slug: "woodwork",
    description: "Carved bowls, turned vessels and fine furniture accents.",
    palette: ["#5C4028", "#8A6642", "#EFE3D3"],
  },
  {
    name: "Glass Art",
    slug: "glass-art",
    description: "Blown glass, kiln-formed pieces and stained glass craft.",
    palette: ["#3A6EA5", "#7FA8CE", "#F1E8DC"],
  },
  {
    name: "Leather Goods",
    slug: "leather-goods",
    description: "Vegetable-tanned leather bags, wallets and accessories.",
    palette: ["#4A3426", "#7A5C44", "#E7DACA"],
  },
  {
    name: "Candles & Soap",
    slug: "candles-soap",
    description: "Small-batch soy candles and cold-process artisan soaps.",
    palette: ["#8A7B5C", "#C9BCA0", "#FAF6F0"],
  },
  {
    name: "Wall Art & Prints",
    slug: "wall-art-prints",
    description: "Original paintings, relief prints and hand-pulled screen prints.",
    palette: ["#2F4A3E", "#6E8F80", "#EFE3D3"],
  },
] as const;

export const MATERIAL_OPTIONS = [
  "Ceramic", "Stoneware", "Porcelain", "Oak", "Walnut", "Ash",
  "Linen", "Wool", "Cotton", "Silk", "Sterling Silver", "Brass",
  "Gold Vermeil", "Leather", "Glass", "Soy Wax", "Beeswax",
] as const;

export const COLOR_OPTIONS = [
  "Terracotta", "Cream", "Charcoal", "Forest Green", "Indigo",
  "Sand", "Rust", "Natural Wood", "Gold", "Slate Blue",
] as const;
