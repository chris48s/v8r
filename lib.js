"use strict";

const Ajv = require("ajv");
const fs = require("fs");
const got = require("got");
const Keyv = require("keyv");
const KeyvFile = require("keyv-file").KeyvFile;
const minimatch = require("minimatch");
const os = require("os");
const path = require("path");
const yaml = require("js-yaml");

const SCHEMA_STORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";
const CACHE_FILE_NAME = `${os.tmpdir()}/keyv-file/v8r.json`;

// Initialize cache
const keyv = new Keyv({
  store: new KeyvFile({
    filename: CACHE_FILE_NAME, // the file path to store the data
    expiredCheckDelay: 24 * 3600 * 1000, // ms, check and remove expired data in each ms (24h refresh delay)
  }),
});

async function fetch(url) {
  // Fetch url
  try {
    const resp = await got(url, { cache: keyv });
    const result = JSON.parse(resp.body);
    result.isFromCache = resp.isFromCache;
    return result;
  } catch (error) {
    if (error.response) {
      throw new Error(`❌ Failed fetching ${url}\n${error.response.body}`);
    }
    throw new Error(`❌ Failed fetching ${url}`);
  }
}

async function getSchemaUrlForFilename(filename) {
  const { schemas } = await fetch(SCHEMA_STORE_CATALOG_URL);

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

  if (matches.length == 1) {
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

function validate(data, schema) {
  const ajv = new Ajv({ schemaId: "auto" });
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  const validate = ajv.compile(schema);
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

async function cli(args) {
  const filename = args.filename;

  const data = parseFile(
    fs.readFileSync(filename, "utf8").toString(),
    path.extname(filename)
  );
  const schemaUrl = args.schema || (await getSchemaUrlForFilename(filename));
  const schema = await fetch(schemaUrl);
  console.log(`Validating ${filename} against schema from ${schemaUrl} ...`);

  const valid = validate(data, schema);
  if (valid) {
    console.log(`✅ ${filename} is valid`);
  } else {
    console.log(`❌ ${filename} is invalid`);
  }
  return valid;
}

module.exports = {
  cli,
  fetch,
  CACHE_FILE_NAME,
  SCHEMA_STORE_CATALOG_URL,
};
