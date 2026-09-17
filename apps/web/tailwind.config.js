/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        accent: {
          lime: "var(--color-accent-lime)",
          "lime-soft": "var(--color-accent-lime-soft)",
          "lime-text": "var(--color-accent-lime-text)",
        },
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          secondary: "var(--color-surface-secondary)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        success: { DEFAULT: "var(--color-success)", bg: "var(--color-success-bg)" },
        warning: { DEFAULT: "var(--color-warning)", bg: "var(--color-warning-bg)" },
        danger: { DEFAULT: "var(--color-danger)", bg: "var(--color-danger-bg)" },
        info: { DEFAULT: "var(--color-info)", bg: "var(--color-info-bg)" },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          surface: "var(--color-sidebar-surface)",
          text: "var(--color-sidebar-text)",
          muted: "var(--color-sidebar-text-muted)",
          active: "var(--color-sidebar-active-bg)",
          "active-text": "var(--color-sidebar-active-text)",
        },
        "dark-card": {
          bg: "var(--color-dark-card-bg)",
          text: "var(--color-dark-card-text)",
          muted: "var(--color-dark-card-text-muted)",
        },
      },
      backgroundImage: {
        "page-gradient": "linear-gradient(135deg, var(--color-page-gradient-start), var(--color-page-gradient-end))",
      },
      fontFamily: {
        sans: ["var(--font-family-primary)"],
      },
      fontSize: {
        display: "var(--font-size-display)",
        "page-title": "var(--font-size-page-title)",
        "section-title": "var(--font-size-section-title)",
        "card-title": "var(--font-size-card-title)",
        body: "var(--font-size-body)",
        secondary: "var(--font-size-secondary)",
        dense: "var(--font-size-dense)",
      },
      spacing: {
        1: "var(--space-1)", 2: "var(--space-2)", 3: "var(--space-3)",
        4: "var(--space-4)", 5: "var(--space-5)", 6: "var(--space-6)",
        8: "var(--space-8)", 10: "var(--space-10)", 12: "var(--space-12)",
        16: "var(--space-16)",
      },
      borderRadius: {
        control: "var(--radius-control)",
        input: "var(--radius-input)",
        button: "var(--radius-button)",
        card: "var(--radius-card)",
        dialog: "var(--radius-dialog)",
        container: "var(--radius-container)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
        dialog: "var(--shadow-dialog)",
        panel: "var(--shadow-panel)",
        "panel-glow": "0 24px 64px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.15), 0 0 80px -20px rgba(34, 197, 94, 0.35)",
        "glow-sm": "0 0 0 3px rgba(34, 197, 94, 0.15)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
      },
      keyframes: {
        "panel-in": {
          "0%": { opacity: "0", transform: "scale(0.98) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "content-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "panel-in": "panel-in 500ms cubic-bezier(0.16, 1, 0.3, 1)",
        "content-in": "content-in 350ms ease-out",
      },
    },
  },
  plugins: [],
};
