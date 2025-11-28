// stylelint.config.mjs
export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-prettier", // выключает правила, конфликтующие с Prettier
  ],
  rules: {
    "selector-class-pattern": null, // пример локального ослабления
  },
  ignoreFiles: ["dist/**", "node_modules/**"],
};
