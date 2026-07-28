import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    port: 5173,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});