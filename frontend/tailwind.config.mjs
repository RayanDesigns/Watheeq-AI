/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: "#050508",
          muted: "rgba(5, 5, 8, 0.55)",
          subtle: "rgba(5, 5, 8, 0.35)",
        },
        bg: {
          DEFAULT: "#fafafd",
          white: "#ffffff",
          muted: "#f0f0f6",
          border: "#e2e2ee",
        },
        primary: {
          DEFAULT: "#0004E8",
          light: "#2a2eed",
          dark: "#0003b8",
          50: "#ededff",
          100: "#d5d5ff",
          200: "#ababff",
          300: "#8182ff",
          400: "#5758ff",
          500: "#0004E8",
          600: "#0003ba",
          700: "#00028b",
          800: "#00025d",
          900: "#00012e",
        },
        secondary: {
          DEFAULT: "#8e8fe6",
          light: "#a8a9ed",
          dark: "#7475d9",
        },
        accent: {
          DEFAULT: "#4a4de9",
          light: "#6b6def",
          dark: "#3234d4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-noto-arabic)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-left": "slideLeft 0.6s ease-out forwards",
        "slide-right": "slideRight 0.6s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      boxShadow: {
        soft: "0 1px 3px rgba(5, 5, 8, 0.05), 0 4px 12px rgba(5, 5, 8, 0.03)",
        card: "0 2px 8px rgba(5, 5, 8, 0.05), 0 8px 24px rgba(5, 5, 8, 0.04)",
        "card-hover": "0 4px 16px rgba(0, 4, 232, 0.08), 0 12px 32px rgba(5, 5, 8, 0.06)",
        elevated: "0 8px 32px rgba(5, 5, 8, 0.08), 0 16px 48px rgba(5, 5, 8, 0.04)",
      },
    },
  },
  plugins: [],
};
