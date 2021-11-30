"use strict";

const AjvDraft4 = require("ajv-draft-04");
const Ajv = require("ajv");
const Ajv2019 = require("ajv/dist/2019");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

function _ajvFactory(schema, cache) {
  const resolver = (url) => cache.fetch(url);
  const opts = { loadSchema: resolver, strict: "log" };

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
        require("ajv/lib/refs/json-schema-draft-06.json")
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

async function validate(data, schema, cache) {
  const ajv = _ajvFactory(schema, cache);
  addFormats(ajv);
  const validateFn = await ajv.compileAsync(schema);
  const valid = validateFn(data);
  if (!valid) {
    console.log("\nErrors:");
    console.log(validateFn.errors);
    console.log("");
  }
  return valid;
}

module.exports = { _ajvFactory, validate };
