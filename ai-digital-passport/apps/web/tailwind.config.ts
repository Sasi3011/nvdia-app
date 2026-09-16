import type { Config } from "tailwindcss";

// Design tokens from spec 05 Section 18 (UI/UX Design System) — exact
// values, not generic component-library defaults. Usage rule (18.2):
// navy is structural, green is active/success, amber is waiting, red is
// stop. Do not introduce additional accent hues.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1D1B20",
        "ink-inverse": "#FFFFFF",
        "navy-900": "#111827",
        "navy-700": "#76B900",
        surface: "#FFFFFF",
        "surface-muted": "#FAFAFA",
        border: "#EBEBEB",
        "text-muted": "#6E6D6D",
        accent: "#76B900",
        "accent-deep": "#5D9500",
        "nvidia-green": "#76B900",
        "nvidia-dark": "#1A1A1A",
        pending: "#B98900",
        rejected: "#B3261E",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "Poppins", "sans-serif"],
        mono: ["var(--font-poppins)", "Poppins", "sans-serif"],
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      fontSize: {
        display: ["34px", { lineHeight: "1.12", fontWeight: "700" }],
        h1: ["24px", { lineHeight: "1.25", fontWeight: "700" }],
        h2: ["20px", { lineHeight: "1.35", fontWeight: "600" }],
        caption: ["13px", { lineHeight: "1.45", fontWeight: "500" }],
      },
      spacing: {
        18: "4.5rem",
      },
      maxWidth: {
        student: "960px",
        console: "1280px",
      },
      borderRadius: {
        card: "26px",
        chip: "999px",
      },
      screens: {
        tablet: "641px",
        desktop: "1025px",
      },
      transitionDuration: {
        fast: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
