import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
        },
        muted: "var(--muted)",
        border: "var(--border)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-subtle": "var(--surface-subtle)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
        logo: ["Sour Gummy", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
