import { createRequire } from "node:module";
// TODO: once JSON modules is stable these requires could become imports
// https://nodejs.org/api/esm.html#esm_experimental_json_modules
const require = createRequire(import.meta.url);

import Ajv2019 from "ajv/dist/2019.js";
import logger from "./logger.js";
import { formatErrors } from "./output-formatters.js";

function validateConfigAgainstSchema(configFile) {
  const ajv = new Ajv2019({ allErrors: true, strict: false });
  const schema = require("../config-schema.json");
  const validateFn = ajv.compile(schema);
  const valid = validateFn(configFile.config);
  if (!valid) {
    logger.log(
      formatErrors(
        configFile.filepath ? configFile.filepath : "",
        validateFn.errors,
      ),
    );
    throw new Error("Malformed config file");
  }
  return true;
}

function validateConfigDocumentParsers(configFile, documentFormats) {
  for (const schema of configFile.config?.customCatalog?.schemas || []) {
    if (schema?.parser != null && !documentFormats.includes(schema?.parser)) {
      throw new Error(
        `Malformed config file: "${schema.parser}" not in ${JSON.stringify(documentFormats)}`,
      );
    }
  }
  return true;
}

function validateConfigOutputFormats(configFile, outputFormats) {
  if (
    configFile.config?.format != null &&
    !outputFormats.includes(configFile.config?.format)
  ) {
    throw new Error(
      `Malformed config file: "${configFile.config.format}" not in ${JSON.stringify(outputFormats)}`,
    );
  }
  return true;
}

export {
  validateConfigAgainstSchema,
  validateConfigDocumentParsers,
  validateConfigOutputFormats,
};
