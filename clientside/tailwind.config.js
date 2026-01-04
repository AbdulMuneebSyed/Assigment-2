/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brutal: {
          black: "#000000",
          white: "#FFFFFF",
          cream: "#FAFAF9",
          yellow: "#FACC15",
          pink: "#EC4899",
          lime: "#84CC16",
          red: "#EF4444",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          orange: "#F97316",
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-sm": "2px 2px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
        "brutal-xl": "8px 8px 0px 0px #000000",
        "brutal-yellow": "4px 4px 0px 0px #FACC15",
        "brutal-pink": "4px 4px 0px 0px #EC4899",
        "brutal-lime": "4px 4px 0px 0px #84CC16",
        "brutal-red": "4px 4px 0px 0px #EF4444",
      },
      borderWidth: {
        3: "3px",
        4: "4px",
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow": "pulse 3s infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
