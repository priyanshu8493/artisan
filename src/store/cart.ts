"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  priceCents: number; // unit price incl. variant delta (USD base)
  variantId?: string | null;
  variantName?: string | null;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  remove: (productId: string, variantId?: string | null) => void;
  setQuantity: (productId: string, variantId: string | null | undefined, qty: number) => void;
  clear: () => void;
  count: () => number;
}

const sameLine = (a: CartItem, productId: string, variantId?: string | null) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(i, item.productId, item.variantId));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameLine(i, item.productId, item.variantId)
                  ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), i.maxStock || 99) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity ?? 1 }],
          };
        }),
      remove: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, variantId)),
        })),
      setQuantity: (productId, variantId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, variantId)
                ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxStock || 99)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    {
      name: "artisan-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
