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
    // Third-party subtree (Stellarium Web 소스) — 우리 코드 아님
    "vendor/**",
    // Stellarium 빌드 결과물 (정적 public 자산)
    "public/stellarium/**",
  ]),
]);

export default eslintConfig;
