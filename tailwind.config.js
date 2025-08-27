/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar-hide"),
    plugin(({ addVariant, matchVariant }) => {
      // Hover media queries
      addVariant("has-hover", "@media (hover: hover) and (pointer: fine)");
      addVariant(
        "no-hover",
        "@media not all and (hover: hover) and (pointer: fine)",
      );

      // Applied on hover if supported, never applied otherwise
      addVariant(
        "hover-never",
        "@media (hover: hover) and (pointer: fine) { &:hover }",
      );
      matchVariant(
        "group-hover-never",
        (_, { modifier }) =>
          `@media (hover: hover) and (pointer: fine) { :merge(.group${
            modifier ? "\\/" + modifier : ""
          }):hover & }`,
        { values: { DEFAULT: "" } },
      );
      matchVariant(
        "peer-hover-never",
        (_, { modifier }) =>
          `@media (hover: hover) and (pointer: fine) { :merge(.peer${
            modifier ? "\\/" + modifier : ""
          }):hover & }`,
        { values: { DEFAULT: "" } },
      );

      // Applied on hover if supported, always applied otherwise
      addVariant("hover-always", [
        "@media (hover: hover) and (pointer: fine) { &:hover }",
        "@media not all and (hover: hover) and (pointer: fine)",
      ]);
      matchVariant(
        "group-hover-always",
        (_, { modifier }) => [
          `@media (hover: hover) and (pointer: fine) { :merge(.group${
            modifier ? "\\/" + modifier : ""
          }):hover & }`,
          "@media not all and (hover: hover) and (pointer: fine)",
        ],
        { values: { DEFAULT: "" } },
      );
      matchVariant(
        "peer-hover-always",
        (_, { modifier }) => [
          `@media (hover: hover) and (pointer: fine) { :merge(.peer${
            modifier ? "\\/" + modifier : ""
          }):hover & }`,
          "@media not all and (hover: hover) and (pointer: fine)",
        ],
        { values: { DEFAULT: "" } },
      );
    }),
  ],
};