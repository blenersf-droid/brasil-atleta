import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes unitarios de modulos puros (src/lib/**) — sem jsdom/testing-library
// nesta fase (ver AGENTS.md / brief FR-0.4). O alias replica exatamente o
// "paths" de tsconfig.json para que os testes importem com "@/..." como o
// resto do app.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
