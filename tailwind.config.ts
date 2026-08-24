import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        cream: "#FAF6F0",
        sand: {
          DEFAULT: "#F1E8DC",
          dark: "#E7DACA",
        },
        charcoal: {
          DEFAULT: "#211E1B",
          soft: "#3A3630",
          muted: "#6E675D",
        },
        forest: {
          DEFAULT: "#2F4A3E",
          light: "#44685A",
        },
        terracotta: {
          DEFAULT: "#C4623A",
          dark: "#A94F2C",
          light: "#E08A63",
        },
        indigo: {
          deep: "#2E3A59",
        },
        gold: "#B98A38",
        success: "#3E7C4F",
        warning: "#C9950B",
        error: "#B3402F",
        info: "#3A6EA5",
        surface: "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.1" }],
        "display-lg": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.15" }],
        "display-md": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.2" }],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(33,30,27,.06), 0 1px 3px rgba(33,30,27,.08)",
        card: "0 2px 8px rgba(33,30,27,.07), 0 8px 24px rgba(33,30,27,.06)",
        lift: "0 4px 12px rgba(33,30,27,.10), 0 16px 40px rgba(33,30,27,.12)",
        innerSoft: "inset 0 1px 2px rgba(33,30,27,.06)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s ease both",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
