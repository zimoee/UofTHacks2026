import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design system palette
        "soft-blue": "#A8C7D9",
        "dusty-pink": "#E8C5C5",
        "sage-green": "#B8C9B8",
        cream: "#F5F3ED",
        "warm-gray": "#8B8B88",
        lavender: "#D4C5E0",
        peachy: "#F4D3C8",
        mint: "#C8E0D7",
        "butter-yellow": "#F4E9C8",
        charcoal: "#3D3D3D",
        "light-gray": "#E8E6E0",
        "off-white": "#FAFAF8",
        "warm-black": "#2B2926",
        // Common semantic aliases
        ink: "#2B2926",
        paper: "#FAFAF8",
        muted: "#E8E6E0",
        border: "#E8E6E0",
        ring: "#A8C7D9",
      },
      boxShadow: {
        // Paper/collage shadows
        paper: "4px 6px 12px rgba(0,0,0,0.08)",
        polaroid: "3px 5px 10px rgba(0,0,0,0.15)",
        lift: "6px 10px 20px rgba(0,0,0,0.12)",
        // Back-compat (used by existing components)
        glow: "0 0 0 1px rgba(232, 230, 224, 1), 0 12px 40px rgba(43, 41, 38, 0.10)",
      },
      fontFamily: {
        script: ["var(--font-script)", "cursive"],
        typewriter: [
          "var(--font-typewriter)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "8px",
        xl: "12px",
      },
      rotate: {
        1: "1deg",
        "-1": "-1deg",
        2: "2deg",
        "-2": "-2deg",
        3: "3deg",
        "-3": "-3deg",
      },
    },
  },
  plugins: [],
};

export default config;
