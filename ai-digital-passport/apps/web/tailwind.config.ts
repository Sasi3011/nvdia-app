import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A", // Dark slate for clean readable text
        "ink-inverse": "#FFFFFF",
        "navy-900": "#0F172A", 
        "navy-700": "#1E293B", 
        surface: "#FFFFFF", 
        "surface-muted": "#F8FAFC", // Clean light surface
        border: "#E2E8F0", 
        "text-muted": "#64748B", 
        accent: "#1755A7", // Exact Primary Blue from user
        "accent-deep": "#103E7E", // Deep Blue
        "accent-light": "#EAF2FC", // Light Blue
        gold: "#F8C401", // Exact Brand Gold from user
        "gold-deep": "#D4A700",
        "gold-light": "#FEF8E3",
        "nvidia-green": "#1755A7",
        "nvidia-dark": "#103E7E",
        pending: "#F8C401",
        rejected: "#DC2626",
        info: "#1755A7",
      },
      backgroundImage: {
        'multi-color': 'linear-gradient(135deg, #1755A7 0%, #F8C401 100%)',
        'brand-gradient': 'linear-gradient(135deg, #1755A7 0%, #103E7E 100%)',
        'gold-gradient': 'linear-gradient(135deg, #F8C401 0%, #D4A700 100%)',
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
        xs: "380px",
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
