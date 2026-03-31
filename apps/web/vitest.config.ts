import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic"
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    exclude: ["src/e2e/**", "node_modules/**"]
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
      "react-router": new URL("./src/compat/react-router.tsx", import.meta.url).pathname
    }
  }
});
