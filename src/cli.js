"use strict";

const Ajv = require("ajv");
const flatCache = require("flat-cache");
const fs = require("fs");
const minimatch = require("minimatch");
const path = require("path");
const yaml = require("js-yaml");
const { cachedFetch } = require("./cache.js");

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";

async function getSchemaUrlForFilename(filename, cache, ttl) {
  const { schemas } = await cachedFetch(SCHEMASTORE_CATALOG_URL, cache, ttl);

  const matches = [];
  schemas.forEach(function (schema) {
    if ("fileMatch" in schema) {
      if (schema.fileMatch.includes(path.basename(filename))) {
        matches.push(schema);
        return;
      }
      for (const glob of schema.fileMatch) {
        if (minimatch(path.normalize(filename), glob)) {
          matches.push(schema);
          break;
        }
      }
    }
  });

  if (matches.length === 1) {
    return matches[0].url;
  }
  if (matches.length > 1) {
    console.log(
      `Found multiple possible schemas for ${filename}. Possible matches:`
    );
    matches.forEach(function (match) {
      console.log(`${match.description}: ${match.url}`);
    });
  }
  throw new Error(`❌ Could not find a schema to validate ${filename}`);
}

async function validate(data, schema, resolver) {
  const ajv = new Ajv({ schemaId: "auto", loadSchema: resolver });
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  const validate = await ajv.compileAsync(schema);
  const valid = validate(data);
  if (!valid) {
    console.log("\nErrors:");
    console.log(validate.errors);
    console.log("");
  }
  return valid;
}

function parseFile(contents, format) {
  switch (format) {
    case ".json":
    case ".geojson":
    case ".jsonld":
      return JSON.parse(contents);
    case ".yml":
    case ".yaml":
      return yaml.safeLoad(contents);
    default:
      throw new Error(`❌ Unsupported format ${format}`);
  }
}

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function Cli(settings) {
  const cache = settings.cache || flatCache.load("v8r");

  return async function (args) {
    const filename = args.filename;
    const ttl = secondsToMilliseconds(args.cacheTtl || 0);

    const data = parseFile(
      fs.readFileSync(filename, "utf8").toString(),
      path.extname(filename)
    );
    const schemaUrl =
      args.schema || (await getSchemaUrlForFilename(filename, cache, ttl));
    const schema = await cachedFetch(schemaUrl, cache, ttl);
    if (
      "$schema" in schema &&
      schema.$schema.includes("json-schema.org/draft/2019-09/schema")
    ) {
      throw new Error(`❌ Unsupported JSON schema version ${schema.$schema}`);
    }
    console.log(`Validating ${filename} against schema from ${schemaUrl} ...`);

    const resolver = function (url) {
      return cachedFetch(url, cache, ttl);
    };
    const valid = await validate(data, schema, resolver);
    if (valid) {
      console.log(`✅ ${filename} is valid`);
    } else {
      console.log(`❌ ${filename} is invalid`);
    }
    return valid;
  };
}

module.exports = { Cli };
