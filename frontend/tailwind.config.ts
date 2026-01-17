import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222.2 84% 4.9%)",
        muted: "hsl(210 40% 96.1%)",
        "muted-foreground": "hsl(215.4 16.3% 46.9%)",
        border: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(222.2 84% 4.9%)",
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(214.3 31.8% 91.4%), 0 12px 40px rgba(2, 6, 23, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

