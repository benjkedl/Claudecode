import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          500: "#4f6ef7",
          600: "#3b57e8",
          700: "#2f48cc",
        },
        accent: {
          emerald: "#10b981",
          violet: "#8b5cf6",
          amber: "#f59e0b",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
