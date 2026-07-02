import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0A",
        card: "#131313",
        line: "#C6FF3D",
        lineDim: "#4b5c1f",
        pink: "#FF3D8A",
        ink: "#F2F2ED",
        mut: "#85857E",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
