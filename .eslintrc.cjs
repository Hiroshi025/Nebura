module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking", // Chequeo de tipos en reglas
    "prettier" // Evita conflictos con Prettier
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "unicorn", "sonarjs"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/no-floating-promises": "error", // Promesas no manejadas
    "unicorn/filename-case": ["error", { "case": "kebabCase" }], // archivos en kebab-case
    "sonarjs/cognitive-complexity": ["error", 15], // Limita complejidad ciclomática
  },
  parserOptions: {
    project: "./tsconfig.json", // Integración con TS
  }
};