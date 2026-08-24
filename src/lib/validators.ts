import { z } from "zod";
import { PRODUCT_STATUSES } from "./constants";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
  role: z.enum(["CUSTOMER", "SELLER"]).default("CUSTOMER"),
  shopName: z.string().min(2).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(24).optional().nullable(),
  region: z.enum(["US", "GB"]),
  marketingOptIn: z.boolean(),
  orderUpdatesOptIn: z.boolean(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export const usPostal = /^[0-9]{5}(-[0-9]{4})?$/;
export const ukPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

export const addressSchema = z
  .object({
    label: z.string().min(1).max(40).default("Home"),
    fullName: z.string().min(2).max(80),
    line1: z.string().min(3).max(120),
    line2: z.string().max(120).optional().nullable(),
    city: z.string().min(2).max(60),
    state: z.string().max(60).optional().nullable(),
    postalCode: z.string().min(3).max(10),
    country: z.enum(["US", "GB"]),
    phone: z.string().max(24).optional().nullable(),
    isDefault: z.boolean().default(false),
  })
  .superRefine((addr, ctx) => {
    const valid =
      addr.country === "US" ? usPostal.test(addr.postalCode) : ukPostcode.test(addr.postalCode);
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postalCode"],
        message:
          addr.country === "US"
            ? "Enter a valid US ZIP code (e.g. 90210)"
            : "Enter a valid UK postcode (e.g. SW1A 1AA)",
      });
    }
  });

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(60),
  optionSize: z.string().max(30).optional().nullable(),
  optionColor: z.string().max(30).optional().nullable(),
  optionMaterial: z.string().max(30).optional().nullable(),
  priceDeltaCents: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).max(100000),
  sku: z.string().max(40).optional().nullable(),
});

export const productSchema = z.object({
  title: z.string().min(3, "Title is required").max(120),
  slug: z
    .string()
    .max(90)
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only")
    .optional()
    .or(z.literal("")),
  description: z.string().min(20, "Description must be at least 20 characters").max(20000),
  story: z.string().max(5000).optional().nullable(),
  sku: z.string().max(40).optional().nullable(),
  priceCents: z.number().int().min(100, "Price must be at least $1").max(10_000_000),
  compareAtCents: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().min(1, "Choose a category"),
  materials: z.string().max(200).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  dimensions: z.string().max(120).optional().nullable(),
  weightGrams: z.number().int().min(0).max(100000).nullable().optional(),
  careInstructions: z.string().max(2000).optional().nullable(),
  originCountry: z.enum(["US", "GB"]).optional().nullable(),
  stock: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(999).default(3),
  status: z.enum(PRODUCT_STATUSES).default("DRAFT"),
  featured: z.boolean().default(false),
  videoUrl: z.string().url().optional().nullable().or(z.literal("")),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  keywords: z.string().max(300).optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().max(160).optional().nullable(),
      })
    )
    .min(1, "Add at least one image")
    .max(10),
  variants: z.array(variantSchema).max(20).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export const checkoutSchema = z.object({
  email: z.string().email(),
  shippingAddress: addressSchema,
  shippingMethod: z.enum(["standard", "express"]),
  customerNote: z.string().max(1000).optional().nullable(),
  couponCode: z.string().max(30).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty"),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  orderItemId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(80).optional().nullable(),
  body: z.string().min(10, "Tell us a little more (10+ chars)").max(4000),
  photos: z.array(z.string()).max(4).optional(),
});

export const sellerResponseSchema = z.object({
  response: z.string().min(2).max(2000),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(2).max(120),
  body: z.string().min(10).max(4000),
  orderId: z.string().optional().nullable(),
});
