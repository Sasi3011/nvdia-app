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
        ink: "#111827", // Dark for text
        "ink-inverse": "#FFFFFF",
        "navy-900": "#111827", 
        "navy-700": "#374151", 
        surface: "#FFFFFF", 
        "surface-muted": "#F3F4F6", // Very light grey background
        border: "#E5E7EB", 
        "text-muted": "#6B7280", 
        accent: "#1A56DB", // Primary Blue from image
        "accent-deep": "#1E429F", // Deep Blue
        "accent-light": "#E1EFFE", // Light Blue
        "nvidia-green": "#1A56DB",
        "nvidia-dark": "#1E429F",
        pending: "#D97706",
        rejected: "#DC2626",
        info: "#1A56DB",
      },
      backgroundImage: {
        'multi-color': 'linear-gradient(135deg, #1A56DB 0%, #1E429F 100%)',
      },
      fontFamily: {
        sans: ["Mazzard", "var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        inter: ["var(--font-inter)", "Inter", "sans-serif"],
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
        card: "12px",
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
