import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildNoscriptMarkup } from "./src/content/noscript";
import { portfolioContent } from "./src/content/portfolioContent";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "portfolio-noscript",
      transformIndexHtml: {
        order: "pre",
        handler: () => [
          {
            tag: "noscript",
            children: buildNoscriptMarkup(portfolioContent),
            injectTo: "body-prepend",
          },
        ],
      },
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
