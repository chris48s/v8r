import { createRequire } from "node:module";
// TODO: once JSON modules is stable these requires could become imports
// https://nodejs.org/api/esm.html#esm_experimental_json_modules
const require = createRequire(import.meta.url);

import AjvDraft4 from "ajv-draft-04";
import Ajv from "ajv";
import Ajv2019 from "ajv/dist/2019.js";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

function _ajvFactory(
  schema,
  strictMode,
  cache,
  resolver = (url) => cache.fetch(url),
) {
  const opts = { allErrors: true, loadSchema: resolver, strict: strictMode };

  if (
    typeof schema["$schema"] === "string" ||
    schema["$schema"] instanceof String
  ) {
    if (schema["$schema"].includes("json-schema.org/draft-04/schema")) {
      opts.schemaId = "auto";
      return new AjvDraft4(opts);
    } else if (schema["$schema"].includes("json-schema.org/draft-06/schema")) {
      const ajvDraft06 = new Ajv(opts);
      ajvDraft06.addMetaSchema(
        require("ajv/lib/refs/json-schema-draft-06.json"),
      );
      return ajvDraft06;
    } else if (schema["$schema"].includes("json-schema.org/draft-07/schema")) {
      return new Ajv(opts);
    } else if (
      schema["$schema"].includes("json-schema.org/draft/2019-09/schema")
    ) {
      return new Ajv2019(opts);
    } else if (
      schema["$schema"].includes("json-schema.org/draft/2020-12/schema")
    ) {
      return new Ajv2020(opts);
    }
  }

  // hedge our bets as best we can
  const ajv = new Ajv(opts);
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  return ajv;

  /* TODO:
  const ajv = new Ajv2019(opts);
  ajv.addMetaSchema(require("ajv/dist/refs/json-schema-draft-07.json"));
  return ajv

  might also be an equally valid fallback here
  */
}

async function validate(data, schema, strictMode, cache, resolver) {
  const ajv = _ajvFactory(schema, strictMode, cache, resolver);
  addFormats(ajv);
  const validateFn = await ajv.compileAsync(schema);
  const valid = validateFn(data);
  return { valid, errors: validateFn.errors ? validateFn.errors : [] };
}

export { _ajvFactory, validate };
