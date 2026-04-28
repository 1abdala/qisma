/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* =========================================
           BRAND & THEME COLORS
           ========================================= */
        "primary": "#84d5c5",
        "primary-container": "#00695c",
        "on-primary": "#003730",
        "on-primary-container": "#94e5d5",

        "secondary": "#ebc23e",

        "tertiary": "#75d1ff",

        /* =========================================
           SURFACE & BACKGROUND COLORS
           ========================================= */
        "surface": "#101413",
        "surface-dim": "#101413",
        "surface-variant": "#313634",
        "on-surface": "#e0e3e1",
        "on-surface-variant": "#bec9c5",
      },
      spacing: {
        /* =========================================
           CUSTOM SPACING & LAYOUT
           ========================================= */
        "container-padding": "24px",
        "stack-md": "24px",
        "gutter": "16px",
      },
      fontFamily: {
        /* =========================================
           TYPOGRAPHY FAMILIES
           ========================================= */
        "body-md": ["Work Sans", "sans-serif"],
        "headline-md": ["Manrope", "sans-serif"],
        "financial-val": ["Manrope", "sans-serif"],
        "label-caps": ["Work Sans", "sans-serif"],
        "manrope": ["Manrope", "sans-serif"],
      },
      fontSize: {
        /* =========================================
           TYPOGRAPHY SIZES & WEIGHTS
           ========================================= */
        "financial-val": ["32px", { lineHeight: "40px", fontWeight: "800" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}