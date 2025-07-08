/**
 * Archivo de configuración de ESLint para el proyecto Nebura Client.
 * Esta configuración está orientada a proyectos Node.js con TypeScript,
 * integrando reglas recomendadas, chequeo de tipos, Prettier y buenas prácticas.
 */

// ====================
// Entornos soportados
// ====================
module.exports = {
  env: {
    node: true, // Habilita variables globales de Node.js
    es2021: true, // Soporta sintaxis ES2021
    jest: true, // Soporta variables globales de Jest para pruebas
  },

  // ====================
  // Extensiones de reglas
  // ====================
  extends: [
    "eslint:recommended", // Reglas recomendadas por ESLint
    "plugin:@typescript-eslint/recommended", // Reglas recomendadas para TypeScript
    "plugin:@typescript-eslint/recommended-requiring-type-checking", // Reglas que requieren chequeo de tipos
    "plugin:eslint-plugin-security",
    "prettier", // Integra Prettier para evitar conflictos de formato
    "plugin:import/typescript", // Soporte para importaciones de TypeScript
  ],

  // ====================
  // Configuración del parser
  // ====================
  parser: "@typescript-eslint/parser", // Parser para TypeScript

  // ====================
  // Plugins adicionales
  // ====================
  plugins: [
    "@typescript-eslint", // Reglas específicas para TypeScript
    "unicorn", // Buenas prácticas y reglas adicionales
    "sonarjs", // Reglas para detectar código complejo o problemático
    "import", // Reglas para manejo de imports
  ],

  // ====================
  // Reglas personalizadas
  // ====================
  rules: {
    "@typescript-eslint/no-explicit-any": "error", // Prohíbe el uso de 'any'
    "@typescript-eslint/no-unsafe-argument": "error", // Prohíbe argumentos inseguros
    "@typescript-eslint/no-floating-promises": "error", // Obliga a manejar promesas
    "unicorn/filename-case": ["error", { case: "kebabCase" }], // Exige archivos en kebab-case
    "sonarjs/cognitive-complexity": ["error", 15], // Limita la complejidad ciclomática
  },

  // ====================
  // Opciones del parser
  // ====================
  parserOptions: {
    project: "./tsconfig.json", // Apunta al archivo de configuración de TypeScript para chequeo de tipos
  },

  // ====================
  // Reglas específicas por archivo
  // ====================
  overrides: [
    {
      files: ["*.test.ts", "*.spec.ts"], // Archivos de pruebas
      rules: {
        "@typescript-eslint/no-explicit-any": "off", // Permite 'any' en pruebas
      },
    },
  ],
};
