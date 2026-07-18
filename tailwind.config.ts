import type { Config } from "tailwindcss";

const config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F2820C",
          ink: "#151413",
          coal: "#24211F",
          field: "#FFFDF8",
          muted: "#8D8378",
          line: "#3A342F",
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', "Impact", "sans-serif"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        action: "0 18px 40px rgba(242, 130, 12, 0.28)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.32)",
      },
      borderRadius: {
        panel: "8px",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
