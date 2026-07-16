import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    pool: "forks",
  },
});
