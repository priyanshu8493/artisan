/** Tiny cookie reader for client components (SSR-safe defaults). */
export const cookies = {
  get(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  },
};
