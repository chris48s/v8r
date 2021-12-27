import flatCache from "flat-cache";
import fs from "fs";
import isUrl from "is-url";
import minimatch from "minimatch";
import os from "os";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { validate } from "./ajv.js";
import { Cache } from "./cache.js";
import { getFiles } from "./glob.js";
import logging from "./logging.js";
import { parseFile } from "./parser.js";

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";

const SCHEMASTORE_CATALOG_SCHEMA_URL =
  "https://json.schemastore.org/schema-catalog.json";

const EXIT = {
  VALID: 0,
  ERROR: 1,
  NOTFOUND: 98,
  INVALID: 99,
};

const CACHE_DIR = path.join(os.tmpdir(), "flat-cache");

async function getFromUrlOrFile(location, cache) {
  return isUrl(location)
    ? await cache.fetch(location)
    : JSON.parse(await fs.promises.readFile(location, "utf8"));
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
      throw new Error(`Malformed catalog at ${catalogLocation}`);
    }

    const { schemas } = catalog;
    const matches = getSchemaMatchesForFilename(schemas, filename);
    logging.debug(`Searching for schema in ${catalogLocation} ...`);
    if (matches.length === 1) {
      logging.info(`Found schema in ${catalogLocation} ...`);
      return matches[0].url; // Match found. We're done.
    }
    if (matches.length === 0 && i < catalogs.length - 1) {
      continue; // No match found. Try the next catalog in the array.
    }
    if (matches.length > 1) {
      // We found >1 matches in the same catalog. This is always a hard error.
      const matchesLog = matches
        .map((match) => `  ${match.description}: ${match.url}`)
        .join("\n");
      logging.info(
        `Found multiple possible schemas for ${filename}. Possible matches:\n${matchesLog}`
      );
    }
    // Either we found >1 matches in the same catalog or we found 0 matches
    // in the last catalog and there are no more catalogs left to try.
    throw new Error(`Could not find a schema to validate ${filename}`);
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

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function getFlatCache() {
  if (process.env.V8R_CACHE_NAME) {
    return flatCache.load(process.env.V8R_CACHE_NAME);
  }
  return flatCache.load("v8r", CACHE_DIR);
}

async function validateFile(filename, args, cache) {
  logging.info(`Processing ${filename}`);
  try {
    const data = parseFile(
      await fs.promises.readFile(filename, "utf8"),
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
    logging.info(
      `Validating ${filename} against schema from ${schemaLocation} ...`
    );

    const valid = await validate(data, schema, cache);
    if (valid) {
      logging.success(`${filename} is valid\n`);
    } else {
      logging.error(`${filename} is invalid\n`);
    }

    if (valid) {
      return EXIT.VALID;
    }
    return EXIT.INVALID;
  } catch (e) {
    logging.error(`${e.message}\n`);
    return EXIT.ERROR;
  }
}

function mergeResults(results, ignoreErrors) {
  const codes = Object.values(results);
  if (codes.includes(EXIT.INVALID)) {
    return EXIT.INVALID;
  }
  if (codes.includes(EXIT.ERROR) && !ignoreErrors) {
    return EXIT.ERROR;
  }
  return EXIT.VALID;
}

function Validator() {
  return async function (args) {
    const filenames = await getFiles(args.pattern);
    if (filenames.length === 0) {
      logging.error(`Pattern '${args.pattern}' did not match any files`);
      return EXIT.NOTFOUND;
    }
    const ttl = secondsToMilliseconds(args.cacheTtl || 0);
    const cache = new Cache(getFlatCache(), ttl);

    const results = Object.fromEntries(filenames.map((key) => [key, null]));
    for (const [filename] of Object.entries(results)) {
      results[filename] = await validateFile(filename, args, cache);
      cache.resetCounters();
    }
    return mergeResults(results, args.ignoreErrors);
  };
}

async function cli(args) {
  logging.init(args.verbose);
  try {
    const validate = new Validator();
    return await validate(args);
  } catch (e) {
    logging.error(e.message);
    return EXIT.ERROR;
  } finally {
    logging.cleanup();
  }
}

function parseArgs(argv) {
  return yargs(hideBin(argv))
    .command(
      "$0 <pattern>",
      "Validate local json/yaml files against schema(s)",
      (yargs) => {
        yargs.positional("pattern", {
          describe: "Glob pattern describing local file or files to validate",
        });
      }
    )
    .version(
      // Workaround for https://github.com/yargs/yargs/issues/1934
      // TODO: remove once fixed
      JSON.parse(
        fs.readFileSync(new URL("../package.json", import.meta.url).pathname)
      ).version
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
        "Local path or URL of a schema to validate against. " +
        "If not supplied, we will attempt to find an appropriate schema on " +
        "schemastore.org using the filename. If passed with a glob pattern " +
        "that matches multiple files, all matching files will be validated " +
        "against this schema",
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
        "Exit with code 0 even if an error was encountered. Passing this flag " +
        "means a non-zero exit code is only issued if validation could be " +
        "completed successfully and one or more files were invalid",
    })
    .option("cache-ttl", {
      type: "number",
      default: 600,
      describe:
        "Remove cached HTTP responses older than <cache-ttl> seconds old. " +
        "Passing 0 clears and disables cache completely",
    }).argv;
}

export { cli, parseArgs };
