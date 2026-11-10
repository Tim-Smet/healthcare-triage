import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Separate config for `npm run eval`: real model calls, never part of `npm test`. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["evals/**/*.eval.ts"],
    testTimeout: 60_000,
  },
});
