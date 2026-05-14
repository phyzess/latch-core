import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist/**",
      "package/**",
      ".astro/**",
      ".wrangler/**",
      "coverage/**",
      "public/services.json"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    }
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        URL: "readonly",
        caches: "readonly",
        fetch: "readonly",
        self: "readonly"
      }
    }
  },
  {
    files: ["scripts/**/*.mjs", "src/cli.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  }
];
