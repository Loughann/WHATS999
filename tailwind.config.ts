import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Cores para o tema dark
        background: "#1A1A1A", // Fundo principal cinza escuro
        foreground: "#E0E0E0", // Texto principal claro
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#969696", // Texto muted cinza médio
          foreground: "#C8C8C8", // Texto muted mais claro
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "#2A2A2A", // Fundo de popover/dropdown
          foreground: "#E0E0E0", // Texto de popover/dropdown
        },
        card: {
          DEFAULT: "#2A2A2A", // Fundo do card cinza escuro
          foreground: "#E0E0E0", // Texto do card
        },
        // Paleta de cores personalizada
        pink: {
          500: "#25D366", // Cor principal verde para o restante do checkout
        },
        green: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        yellow: {
          500: "#FFD700",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-green": {
          "0%, 100%": {
            transform: "scale(1)",
            "box-shadow": "0 0 0 0 rgba(37, 211, 102, 0.7)",
          },
          "50%": {
            transform: "scale(1.02)",
            "box-shadow": "0 0 0 10px rgba(37, 211, 102, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-green": "pulse-green 1.5s infinite",
      },
      textShadow: {
        "green-glow": "0 0 8px rgba(21, 255, 0, 0.8), 0 0 15px rgba(21, 255, 0, 0.6)",
        "blue-glow": "0 0 8px rgba(0, 191, 255, 0.8), 0 0 15px rgba(0, 191, 255, 0.6)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addUtilities, theme }: { addUtilities: any; theme: any }) => {
      const newUtilities = {
        ".text-glow-green": {
          "text-shadow": theme("textShadow.green-glow"),
        },
        ".text-glow-blue": {
          "text-shadow": theme("textShadow.blue-glow"),
        },
      }
      addUtilities(newUtilities, ["responsive", "hover"])
    },
  ],
} satisfies Config

export default config
