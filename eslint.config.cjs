const globals = require("globals");
const js = require("@eslint/js");
const jsdocPlugin = require("eslint-plugin-jsdoc");
const prettierConfig = require("eslint-config-prettier");
const prettierPlugin = require("eslint-plugin-prettier");
const mochaPlugin = require("eslint-plugin-mocha");

module.exports = [
  {
    ignores: ["docs/.docusaurus/**/*", "docs/build/**/*"],
  },
  js.configs.recommended,
  mochaPlugin.configs.flat.recommended,
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
      "mocha/no-skipped-tests": ["error"],
      "mocha/no-exclusive-tests": ["error"],
      "mocha/max-top-level-suites": ["off"],
      "jsdoc/require-jsdoc": ["off"],
      "jsdoc/tag-lines": ["off"], // let prettier-plugin-jsdoc take care of this
    },
  },
];
