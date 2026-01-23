import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Avoid Windows file-lock issues under node_modules (EPERM rename in .vitest)
  cacheDir: ".vitest",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setupTests.ts",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
