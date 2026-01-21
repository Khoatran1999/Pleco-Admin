module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // QUAN TRỌNG: tắt rule format
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    // 🔥 Rule quan trọng – nên fail CI
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",

    // ⚠️ Relax bớt cho FE
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
