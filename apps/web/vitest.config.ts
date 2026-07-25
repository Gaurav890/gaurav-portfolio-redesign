import path from "node:path";
import { defineConfig } from "vitest/config";

// Minimal Vitest config added alongside T-031/T-035 (the first tests in
// this repo — apps/web previously had no test script, deliberately, per
// docs/40-execution/CURRENT_STATE.md). Node environment only: these are
// Route Handler / server-side logic tests, not component tests, so no DOM
// environment is configured here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
