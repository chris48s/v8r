import { createRequire } from "module";
// TODO: once JSON modules is stable these requires could become imports
// https://nodejs.org/api/esm.html#esm_experimental_json_modules
const require = createRequire(import.meta.url);

import url from "url";
import Ajv from "ajv";
import {
  SarifBuilder,
  SarifRunBuilder,
  SarifResultBuilder,
} from "node-sarif-builder";
import logger from "./logger.js";

function logErrors(filename, errors) {
  const ajv = new Ajv();
  logger.log(
    ajv.errorsText(errors, {
      separator: "\n",
      dataVar: filename + "#",
    })
  );
  logger.log("");
}

function resultsToJson(results) {
  return JSON.stringify({ results }, null, 2);
}

function resultsToSarif(results) {
  const pkg = require("../package.json");
  const sarifBuilder = new SarifBuilder();
  const sarifRunBuilder = new SarifRunBuilder().initSimple({
    toolDriverName: pkg.name,
    toolDriverVersion: pkg.version,
    url: pkg.homepage,
  });
  for (const result of Object.values(results)) {
    if (result.valid) {
      const sarifResultBuilder = new SarifResultBuilder();
      const sarifResultInit = {
        level: "note",
        messageText: "file is valid",
        fileUri: url.pathToFileURL(result.fileLocation).href,
      };
      sarifResultBuilder.initSimple(sarifResultInit);
      sarifRunBuilder.addResult(sarifResultBuilder);
      continue;
    }

    for (const error of result.errors) {
      const sarifResultBuilder = new SarifResultBuilder();
      const sarifResultInit = {
        level: "error",
        ruleId: error.keyword,
        messageText: error.message,
        fileUri: url.pathToFileURL(result.fileLocation).href,
      };
      sarifResultBuilder.initSimple(sarifResultInit);
      sarifRunBuilder.addResult(sarifResultBuilder);
    }
  }
  sarifBuilder.addRun(sarifRunBuilder);
  const sarifJsonString = sarifBuilder.buildSarifJsonString({ indent: true });
  return sarifJsonString;
}

export { logErrors, resultsToJson, resultsToSarif };
