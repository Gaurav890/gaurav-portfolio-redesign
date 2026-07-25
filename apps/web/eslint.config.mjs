import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // react-hooks/immutability (part of the React Compiler's stricter
    // hooks rules) assumes ref/memo values are never mutated across
    // React's own effect/render boundaries. That's the right default,
    // but it doesn't understand react-three-fiber's `useFrame` -
    // mutating refs and Three.js buffer contents every frame inside
    // `useFrame` is R3F's own documented, correct, performant pattern
    // (allocating fresh objects 60x/sec would defeat the purpose).
    // Scoped to this one file rather than disabled project-wide.
    files: ["src/components/hero/hero-webgl-background.tsx"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
