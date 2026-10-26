import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // include を指定すると既定の対象が置き換わるので、templates/ のひな形（node:test で書いた試験）は対象に入らない。
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
