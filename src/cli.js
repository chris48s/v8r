import Ajv from "ajv";
import flatCache from "flat-cache";
import fs from "fs";
import os from "os";
import path from "path";
import { validate } from "./ajv.js";
import { Cache } from "./cache.js";
import { getCatalogs, getMatchForFilename } from "./catalogs.js";
import { getConfig } from "./config.js";
import { getFiles } from "./glob.js";
import { getFromUrlOrFile } from "./io.js";
import logger from "./logger.js";
import { parseFile } from "./parser.js";

const EXIT = {
  VALID: 0,
  ERROR: 1,
  INVALID_CONFIG: 97,
  NOT_FOUND: 98,
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

async function validateFile(filename, config, cache) {
  logger.info(`Processing ${filename}`);
  let result = {
    fileLocation: filename,
    schemaLocation: null,
    valid: null,
    errors: [],
    code: null,
  };
  try {
    const catalogs = getCatalogs(config);
    const catalogMatch = config.schema
      ? {}
      : await getMatchForFilename(catalogs, filename, cache);
    const schemaLocation = config.schema || catalogMatch.location;
    result.schemaLocation = schemaLocation;
    const schema = await getFromUrlOrFile(schemaLocation, cache);
    logger.info(
      `Validating ${filename} against schema from ${schemaLocation} ...`
    );

    const data = parseFile(
      await fs.promises.readFile(filename, "utf8"),
      catalogMatch.parser ? `.${catalogMatch.parser}` : path.extname(filename)
    );

    const strictMode = config.verbose >= 2 ? "log" : false;
    const { valid, errors } = await validate(data, schema, strictMode, cache);
    result.valid = valid;
    result.errors = errors;
    if (valid) {
      logger.success(`${filename} is valid\n`);
    } else {
      logger.error(`${filename} is invalid\n`);
    }

    result.code = valid ? EXIT.VALID : EXIT.INVALID;
    return result;
  } catch (e) {
    logger.error(`${e.message}\n`);
    result.code = EXIT.ERROR;
    return result;
  }
}

function resultsToStatusCode(results, ignoreErrors) {
  const codes = Object.values(results).map((result) => result.code);
  if (codes.includes(EXIT.INVALID)) {
    return EXIT.INVALID;
  }
  if (codes.includes(EXIT.ERROR) && !ignoreErrors) {
    return EXIT.ERROR;
  }
  return EXIT.VALID;
}

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

function Validator() {
  return async function (config) {
    let filenames = [];
    for (const pattern of config.patterns) {
      const matches = await getFiles(pattern);
      if (matches.length === 0) {
        logger.error(`Pattern '${pattern}' did not match any files`);
        return EXIT.NOT_FOUND;
      }
      filenames = filenames.concat(matches);
    }

    const ttl = secondsToMilliseconds(config.cacheTtl || 0);
    const cache = new Cache(getFlatCache(), ttl);

    const results = Object.fromEntries(filenames.map((key) => [key, null]));
    for (const [filename] of Object.entries(results)) {
      results[filename] = await validateFile(filename, config, cache);

      if (!results[filename].valid && config.format === "text") {
        logErrors(filename, results[filename].errors);
      }
      // else: silence is golden

      cache.resetCounters();
    }

    if (config.format === "json") {
      logger.log(JSON.stringify({ results }, null, 2));
    }

    return resultsToStatusCode(results, config.ignoreErrors);
  };
}

async function cli(config) {
  if (!config) {
    try {
      config = await getConfig(process.argv);
    } catch (e) {
      logger.error(e.message);
      return EXIT.INVALID_CONFIG;
    }
  }

  logger.setVerbosity(config.verbose);
  logger.debug(`Merged args/config: ${JSON.stringify(config, null, 2)}`);

  try {
    const validate = new Validator();
    return await validate(config);
  } catch (e) {
    logger.error(e.message);
    return EXIT.ERROR;
  }
}

export { cli };
