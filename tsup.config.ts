import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // All exports are client components/hooks; the source files each carry
  // their own "use client" but bundling merges them into one file, so a
  // single directive is re-applied to the emitted bundle for Next.js's
  // client/server boundary detection.
  banner: { js: '"use client";' },
});
