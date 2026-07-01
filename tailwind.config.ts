import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism palette — source of truth: ideas/designUI/CONTEXTO_PLATAFORMA.md
        primary: "#334537",            // Verde botanico — headings, primary CTAs, navbar
        secondary: "#e9c349",          // Dorado — accents, links, secondary CTAs
        surface: "#f4fbf2",            // Crema — page background, glass card tint base
        "surface-container": "#e9f0e7",// Tinted surface for sections / hover states
        "surface-border": "#dde4db",   // Hairline borders for glass cards and dividers
        "on-surface": "#161d18",       // Default body text on surface
        "on-surface-variant": "#3a4239"// Muted body text on surface
      },
      fontFamily: {
        // Playfair Display — headlines, brand mark, display copy
        serif: [
          "var(--font-serif)",
          "Playfair Display",
          "ui-serif",
          "Georgia",
          "serif"
        ],
        // Plus Jakarta Sans — body, labels, UI
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ]
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem"
      },
      backdropBlur: {
        glass: "20px"
      }
    },
    // Design system tokens must be available as part of the public API, not
    // only when a component happens to use them. The landing sections, blog
    // components, and shared primitives all consume these utilities.
    safelist: [
      "glass-card",
      "gold-border",
      "backdrop-blur-glass",
      {
        pattern: /^(bg|text|border)-(primary|secondary|surface|surface-container|surface-border|on-surface|on-surface-variant)$/
      },
      {
        pattern: /^font-(serif|sans)$/
      }
    ]
  },
  plugins: []
};

export default config;
