import globals from "globals";
import js from "@eslint/js";
import jsdocPlugin from "eslint-plugin-jsdoc";
import nodeCoreTestPlugin from "eslint-plugin-node-core-test";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const config = [
  {
    ignores: ["docs/.docusaurus/**/*", "docs/build/**/*", "build/**/*"],
  },
  js.configs.recommended,
  prettierConfig,
  jsdocPlugin.configs["flat/recommended-error"],
  nodeCoreTestPlugin.configs.recommended,
  {
    plugins: {
      jsdoc: jsdocPlugin,
      prettier: prettierPlugin,
      "node-core-test": nodeCoreTestPlugin,
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
      "node-core-test/no-exclusive-tests": ["error"],
      "node-core-test/no-incomplete-tests": ["error"],
      "node-core-test/no-skipped-tests": ["error"],
      "jsdoc/require-jsdoc": ["off"],
      "jsdoc/tag-lines": ["off"], // let prettier-plugin-jsdoc take care of this
    },
  },
];

export default config;
