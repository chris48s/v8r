import globals from "globals";
import js from "@eslint/js";
import jsdocPlugin from "eslint-plugin-jsdoc";
import noOnlyTestsPlugin from "eslint-plugin-no-only-tests";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const config = [
  {
    ignores: ["docs/.docusaurus/**/*", "docs/build/**/*", "build/**/*"],
  },
  js.configs.recommended,
  prettierConfig,
  jsdocPlugin.configs["flat/recommended-error"],
  {
    plugins: {
      prettier: prettierPlugin,
      jsdoc: jsdocPlugin,
      "no-only-tests": noOnlyTestsPlugin,
    },
    languageOptions: {
      ecmaVersion: 2026,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "prettier/prettier": ["error"],
      "no-only-tests/no-only-tests": ["error"],
      "jsdoc/require-jsdoc": ["off"],
      "jsdoc/tag-lines": ["off"], // let prettier-plugin-jsdoc take care of this
    },
  },
];

export default config;
