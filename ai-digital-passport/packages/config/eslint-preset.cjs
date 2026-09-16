/**
 * Shared ESLint base rules for all workspace packages. App-level configs
 * (apps/web, apps/api) extend this alongside "next/core-web-vitals".
 */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  ignorePatterns: ["dist", ".next", "out", "node_modules", "prisma/generated"],
};
