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
const { cachedFetch } = require("./cache.js");
const logging = require("./logging.js");

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";
const CACHE_DIR = path.join(os.tmpdir(), "flat-cache");

async function getSchemaUrlForFilename(filename, cache, ttl, catalogs) {
  let schemaLocation;
  try {
    const schemas = catalogs.flatMap((c) =>
      JSON.parse(fs.readFileSync(c, "utf8").toString()).schemas.map((s) => {
        if (!isUrl(s.url)) {
          s.url = path.resolve(path.dirname(c), s.url);
        }
        return s;
      })
    );
    schemaLocation = getSchemaMatchForFilename(schemas, filename);
  } catch {
    const { schemas } = await cachedFetch(SCHEMASTORE_CATALOG_URL, cache, ttl);
    schemaLocation = getSchemaMatchForFilename(schemas, filename);
  }
  return schemaLocation;
}

function getSchemaMatchForFilename(schemas, filename) {
  const matches = [];
  schemas.forEach((schema) => {
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
      return yaml.load(contents);
    default:
      throw new Error(`❌ Unsupported format ${format}`);
  }
}

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function getCache() {
  if (process.env.V8R_CACHE_NAME) {
    return flatCache.load(process.env.V8R_CACHE_NAME);
  }
  return flatCache.load("v8r", CACHE_DIR);
}

function Validator() {
  const cache = getCache();

  return async function (args) {
    const filename = args.filename;
    const ttl = secondsToMilliseconds(args.cacheTtl || 0);

    const data = parseFile(
      fs.readFileSync(filename, "utf8").toString(),
      path.extname(filename)
    );

    for (const catalog of args.catalogs) {
      if (!fs.existsSync(catalog)) {
        throw new Error(`❌ Catalog not found: ${catalog}`);
      }
    }
    const schemaLocation =
      args.schema ||
      (await getSchemaUrlForFilename(filename, cache, ttl, args.catalogs));
    const schema = isUrl(schemaLocation)
      ? await cachedFetch(schemaLocation, cache, ttl)
      : JSON.parse(fs.readFileSync(schemaLocation, "utf8").toString());
    if (
      "$schema" in schema &&
      schema.$schema.includes("json-schema.org/draft/2019-09/schema")
    ) {
      throw new Error(`❌ Unsupported JSON schema version ${schema.$schema}`);
    }
    console.log(
      `Validating ${filename} against schema from ${schemaLocation} ...`
    );

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
      default: [],
      describe:
        "Local paths of custom catalogs to use prior to schemastore.org",
    })
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
