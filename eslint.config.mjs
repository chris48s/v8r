import globals from "globals";
import js from "@eslint/js";
import jsdocPlugin from "eslint-plugin-jsdoc";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import mochaPlugin from "eslint-plugin-mocha";

const config = [
  {
    ignores: ["docs/.docusaurus/**/*", "docs/build/**/*"],
  },
  js.configs.recommended,
  mochaPlugin.configs.recommended,
  prettierConfig,
  jsdocPlugin.configs["flat/recommended-error"],
  {
    plugins: {
      mocha: mochaPlugin,
      prettier: prettierPlugin,
      jsdoc: jsdocPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        mocha: true,
        ...globals.node,
      },
    },
    rules: {
      "prettier/prettier": ["error"],
      "mocha/no-pending-tests": ["error"],
      "mocha/no-exclusive-tests": ["error"],
      "mocha/max-top-level-suites": ["off"],
      "jsdoc/require-jsdoc": ["off"],
      "jsdoc/tag-lines": ["off"], // let prettier-plugin-jsdoc take care of this
    },
  },
];

export default config;
