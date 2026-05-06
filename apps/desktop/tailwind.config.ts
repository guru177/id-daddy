import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mint: "#0f766e",
        coral: "#c2410c"
      }
    }
  },
  plugins: []
} satisfies Config;
