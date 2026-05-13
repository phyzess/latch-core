import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["dist/**", ".astro/**", "public/**"]
    },
    include: ["tests/**/*.test.ts"]
  }
});
