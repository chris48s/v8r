import flatCache from "flat-cache";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { validate } from "./ajv.js";
import { Cache } from "./cache.js";
import { getSchemaUrlForFilename } from "./catalogs.js";
import { getFiles } from "./glob.js";
import { getFromUrlOrFile } from "./io.js";
import logging from "./logging.js";
import { parseFile } from "./parser.js";

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";

const EXIT = {
  VALID: 0,
  ERROR: 1,
  NOTFOUND: 98,
  INVALID: 99,
};

const CACHE_DIR = path.join(os.tmpdir(), "flat-cache");

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
    let filenames = [];
    for (const pattern of args.patterns) {
      const matches = await getFiles(pattern);
      if (matches.length === 0) {
        logging.error(`Pattern '${pattern}' did not match any files`);
        return EXIT.NOTFOUND;
      }
      filenames = filenames.concat(matches);
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
      "$0 <patterns..>",
      "Validate local json/yaml files against schema(s)",
      (yargs) => {
        yargs.positional("patterns", {
          describe:
            "One or more filenames or glob patterns describing local file or files to validate",
        });
      }
    )
    .version(
      // Workaround for https://github.com/yargs/yargs/issues/1934
      // TODO: remove once fixed
      createRequire(import.meta.url)("../package.json").version
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
        "schemastore.org using the filename. If passed with glob pattern(s) " +
        "matching multiple files, all matching files will be validated " +
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
