"use strict";

const Ajv = require("ajv");
const flatCache = require("flat-cache");
const fs = require("fs");
const isUrl = require("is-url");
const minimatch = require("minimatch");
const os = require("os");
const path = require("path");
const yaml = require("js-yaml");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Cache } = require("./cache.js");
const logging = require("./logging.js");

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";

const SCHEMASTORE_CATALOG_SCHEMA_URL =
  "https://json.schemastore.org/schema-catalog.json";

const CACHE_DIR = path.join(os.tmpdir(), "flat-cache");

async function getFromUrlOrFile(location, cache) {
  return isUrl(location)
    ? await cache.fetch(location)
    : JSON.parse(fs.readFileSync(location, "utf8").toString());
}
async function getSchemaUrlForFilename(catalogs, filename, cache) {
  for (const [i, catalogLocation] of catalogs.entries()) {
    const catalog = await getFromUrlOrFile(catalogLocation, cache);
    const catalogSchema = await getFromUrlOrFile(
      SCHEMASTORE_CATALOG_SCHEMA_URL,
      cache
    );

    // Validate the catalog
    const valid = await validate(catalog, catalogSchema, cache);
    if (!valid || catalog.schemas === undefined) {
      throw new Error(`❌ Malformed catalog at ${catalogLocation}`);
    }

    const { schemas } = catalog;
    const matches = getSchemaMatchesForFilename(schemas, filename);
    if (matches.length === 1) {
      console.log(`ℹ️ Found schema in ${catalogLocation} ...`);
      return matches[0].url; // Match found. We're done.
    }
    if (matches.length === 0 && i < catalogs.length - 1) {
      continue; // No match found. Try the next catalog in the array.
    }
    if (matches.length > 1) {
      // We found >1 matches in the same catalog. This is always a hard error.
      console.log(
        `Found multiple possible schemas for ${filename}. Possible matches:`
      );
      matches.forEach(function (match) {
        console.log(`${match.description}: ${match.url}`);
      });
    }
    // Either we found >1 matches in the same catalog or we found 0 matches
    // in the last catalog and there are no more catalogs left to try.
    throw new Error(`❌ Could not find a schema to validate ${filename}`);
  }
}

function getSchemaMatchesForFilename(schemas, filename) {
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
  return matches;
}

async function validate(data, schema, cache) {
  const resolver = (url) => cache.fetch(url);
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
      return yaml.load(contents);
    default:
      throw new Error(`❌ Unsupported format ${format}`);
  }
}

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function getFlatCache() {
  if (process.env.V8R_CACHE_NAME) {
    return flatCache.load(process.env.V8R_CACHE_NAME);
  }
  return flatCache.load("v8r", CACHE_DIR);
}

function Validator() {
  return async function (args) {
    const filename = args.filename;
    const ttl = secondsToMilliseconds(args.cacheTtl || 0);
    const cache = new Cache(getFlatCache(), ttl);

    const data = parseFile(
      fs.readFileSync(filename, "utf8").toString(),
      path.extname(filename)
    );

    const schemaLocation =
      args.schema ||
      (await getSchemaUrlForFilename(
        (args.catalogs || []).concat([SCHEMASTORE_CATALOG_URL]),
        filename,
        cache
      ));
    const schema = await getFromUrlOrFile(schemaLocation, cache);
    if (
      "$schema" in schema &&
      schema.$schema.includes("json-schema.org/draft/2019-09/schema")
    ) {
      throw new Error(`❌ Unsupported JSON schema version ${schema.$schema}`);
    }
    console.log(
      `Validating ${filename} against schema from ${schemaLocation} ...`
    );

    const valid = await validate(data, schema, cache);
    if (valid) {
      console.log(`✅ ${filename} is valid`);
    } else {
      console.log(`❌ ${filename} is invalid`);
    }
    return valid;
  };
}

async function cli(args) {
  logging.init(args.verbose);
  try {
    const validate = new Validator();
    const valid = await validate(args);
    if (valid) {
      return 0;
    }
    return 99;
  } catch (e) {
    console.error(e.message);
    if (args.ignoreErrors) {
      return 0;
    }
    return 1;
  } finally {
    logging.cleanup();
  }
}

function parseArgs(argv) {
  return yargs(hideBin(argv))
    .command(
      "$0 <filename>",
      "Validate a local json/yaml file against a schema",
      (yargs) => {
        yargs.positional("filename", { describe: "Local file to validate" });
      }
    )
    .option("verbose", {
      alias: "v",
      type: "boolean",
      description: "Run with verbose logging. Can be stacked e.g: -vv -vvv",
    })
    .count("verbose")
    .option("schema", {
      alias: "s",
      type: "string",
      describe:
        "Local path or URL of schema to validate file against. If not supplied, we will attempt to find an appropriate schema on schemastore.org using the filename",
    })
    .option("catalogs", {
      type: "string",
      alias: "c",
      array: true,
      describe:
        "Local path or URL of custom catalogs to use prior to schemastore.org",
    })
    .conflicts("schema", "catalogs")
    .option("ignore-errors", {
      type: "boolean",
      default: false,
      describe:
        "Exit with code 0 even if an error was encountered. Passing this flag means a non-zero exit code is only issued if validation could be completed successfully and the file was invalid",
    })
    .option("cache-ttl", {
      type: "number",
      default: 600,
      describe:
        "Remove cached HTTP responses older than <cache-ttl> seconds old. Passing 0 clears and disables cache completely",
    }).argv;
}

module.exports = { cli, parseArgs };
