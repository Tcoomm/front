import js from "@eslint/js";
import ts from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
// Prettier ↔ ESLint
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // что игнорим
  { ignores: ["dist/**", "node_modules/**"] },

  // базовые правила JS/TS
  js.configs.recommended,
  ...ts.configs.recommended,

  // React + Hooks (только для TSX)
  {
    files: ["**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      prettier: eslintPluginPrettier, // ← подключаем как плагин
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // дружим с Prettier: выключаем конфликтующие правила
      ...eslintConfigPrettier.rules,
      // а тут — заставляем ESLint ругаться, если формат не по Prettier
      "prettier/prettier": "error",

      // проектные послабления
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "18.3" } },
  },

  // общие послабления/настройки
  {
    rules: {
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
];
