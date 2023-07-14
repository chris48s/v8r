import Ajv from "ajv";
import logger from "./logger.js";

function logErrors(filename, errors) {
  const ajv = new Ajv();
  logger.log(
    ajv.errorsText(errors, {
      separator: "\n",
      dataVar: filename + "#",
    }),
  );
  logger.log("");
}

function resultsToJson(results) {
  logger.log(JSON.stringify({ results }, null, 2));
}

export { logErrors, resultsToJson };
