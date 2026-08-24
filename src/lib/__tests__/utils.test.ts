import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug, generateOrderNumber, clamp, truncate } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and dashes non-alphanumerics", () => {
    expect(slugify("Hand-Thrown Stoneware Mug!")).toBe("hand-thrown-stoneware-mug");
  });

  it("strips apostrophes before dashing", () => {
    expect(slugify("Maya's Pottery")).toBe("mayas-pottery");
    expect(slugify("l’atelier")).toBe("latelier");
  });

  it("trims leading/trailing dashes and caps at 80 chars", () => {
    expect(slugify("--Hello World--")).toBe("hello-world");
    expect(slugify("a".repeat(120)).length).toBeLessThanOrEqual(80);
  });

  it("returns empty string for symbol-only input", () => {
    expect(slugify("***")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("appends a random suffix to the slugged base", () => {
    const s = uniqueSlug("Willow & Kiln Vase");
    expect(s).toMatch(/^willow-kiln-vase-[a-z0-9]{5}$/);
  });

  it("falls back to 'item' when the base produces no slug", () => {
    expect(uniqueSlug("###")).toMatch(/^item-[a-z0-9]{5}$/);
  });
});

describe("generateOrderNumber", () => {
  it("matches the AM-XXXXX-XXXX shape", () => {
    expect(generateOrderNumber()).toMatch(/^AM-[A-Z0-9]+-[A-Z0-9]{4}$/);
  });
});

describe("clamp", () => {
  it("clamps within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("cuts long strings and appends an ellipsis", () => {
    const out = truncate("abcdefghij", 6);
    expect(out.length).toBeLessThanOrEqual(6);
    expect(out.endsWith("…")).toBe(true);
  });
});
